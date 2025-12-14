"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import * as fs from 'fs';
import * as path from 'path';

// Helper to get authenticated Supabase client
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
           try {
             cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
           } catch { }
        },
      },
    }
  );
}

// Recursive search helper
// Recursive search helper
function findFileRecursive(dir: string, targetName: string): string | null {
  try {
    if (!fs.existsSync(dir)) return null;
    
    // Normalize targetBase (remove extension) - handle NFD/NFC if possible, usually direct string comparison works in Node
    const targetNormalized = targetName.normalize ? targetName.normalize('NFC') : targetName;
    const targetBase = path.parse(targetNormalized).name;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const found = findFileRecursive(fullPath, targetName);
        if (found) return found;
      } else {
        const entryName = entry.name.normalize ? entry.name.normalize('NFC') : entry.name;
        const entryBase = path.parse(entryName).name;

        // 1. Exact Match (Full name)
        if (entryName === targetNormalized) return fullPath;
        
        // 2. Base Match (No extension) - solves .jpg vs .png
        if (entryBase === targetBase) return fullPath;

        // 3. Fuzzy Match (if long enough) for suffixes like (1), _copy, etc.
        // Prevent matching short generic names
        if (targetBase.length > 8) {
             if (entryBase.includes(targetBase) || targetBase.includes(entryBase)) {
                 return fullPath;
             }
        }
      }
    }
  } catch (e) {
    return null; 
  }
  return null;
}

export async function importPortfolio(id: number) {
  const supabase = await getSupabase();

  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 2. Fetch Migrated Post
  const { data: post, error } = await supabase
    .from("migrated_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) {
    throw new Error("항목을 찾을 수 없습니다.");
  }

  let content = post.content || "";
  let thumbnailUrl: string | null = null;
  const processedImages: string[] = [];

  // 3. Process Images in Content
  // Regex to find img src. Handles both existing full URLs and potential weird ones.
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  const replacements: { original: string; new: string }[] = [];
  
  console.log(`[Import] Post ID: ${id}, Title: ${post.title}`);

  // We need to loop regex matches first
  while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      console.log(`[Import] Found Image SRC: ${src}`);

      // Check if it's a migration image
      if (src.includes("/migration_uploads/") || src.includes("/wp-content/uploads/")) {
          
          // Determine path in 'migration_uploads' bucket
          let storagePath = "";
          if (src.includes("/migration_uploads/")) {
              // Extract relative path after migration_uploads/
              const parts = src.split("/migration_uploads/");
              if (parts.length > 1) storagePath = parts[1]; // Already encoded?
          } else if (src.includes("/wp-content/uploads/")) {
               // Mapping: wp-content/uploads/2021/04/file.jpg -> 2021/04/file.jpg
               const parts = src.split("/wp-content/uploads/");
               if (parts.length > 1) storagePath = parts[1];
          }

          if (storagePath) {
              // Decode path if needed (browser might have encoded it)
              const decodedPath = decodeURIComponent(storagePath);
              console.log(`[Import] Decoding path: ${storagePath} -> ${decodedPath}`);
              
              // 3.1 Download from migration_uploads
              let fileData: any = null;
              let fileType = "application/octet-stream";
              
              let { data: fileBlob, error: downloadError } = await supabase.storage
                  .from("migration_uploads")
                  .download(decodedPath);

              if (!downloadError && fileBlob) {
                  fileData = fileBlob;
                  fileType = fileBlob.type;
              }

              // 3.1.1 Fallback: Fuzzy Search if exact download fails
              if (downloadError) {
                  console.warn(`[Import] Direct download failed for ${decodedPath}. Trying fuzzy search...`);
                  
                  // Extract folder and filename
                  const pathParts = decodedPath.split('/');
                  const fileName = pathParts.pop();
                  const folderPath = pathParts.join('/');

                  if (fileName && folderPath) {
                       // Increase limit to 1000 to find hidden files
                       const { data: fileList } = await supabase.storage.from("migration_uploads").list(folderPath, { limit: 1000 });
                       if (fileList) {
                           const exactMatch = fileList.find(f => f.name === fileName);
                           const fuzzyMatch = fileList.find(f => f.name.includes(fileName) || fileName.includes(f.name));
                           
                           const finalMatch = exactMatch || fuzzyMatch;
                           
                           if (finalMatch) {
                               console.log(`[Import] Fuzzy match found: ${finalMatch.name} (Original: ${fileName})`);
                               const newDownloadPath = `${folderPath}/${finalMatch.name}`;
                               const { data: fuzzyBlob, error: fuzzyError } = await supabase.storage
                                    .from("migration_uploads")
                                    .download(newDownloadPath);
                               
                               if (!fuzzyError && fuzzyBlob) {
                                   fileData = fuzzyBlob;
                                   fileType = fuzzyBlob.type;
                                   downloadError = null; // Cleared
                               }
                           }
                       }

                       // 3.1.2 Fallback: Local File System (public/legacy_uploads)
                       if (downloadError) { // Still error?
                            // Try Local
                            const localFilePath = path.join(process.cwd(), 'public/legacy_uploads', folderPath, fileName);
                            // Convert path separators if needed (Windows) - path.join handles it usually
                            if (fs.existsSync(localFilePath)) {
                                console.log(`[Import] Found LOCAL file: ${localFilePath}`);
                                try {
                                    fileData = fs.readFileSync(localFilePath);
                                    // Guess Mime
                                    const ext = path.extname(localFilePath).toLowerCase();
                                    if (ext === '.jpg' || ext === '.jpeg') fileType = 'image/jpeg';
                                    else if (ext === '.png') fileType = 'image/png';
                                    else if (ext === '.gif') fileType = 'image/gif';
                                    else if (ext === '.webp') fileType = 'image/webp';
                                    else if (ext === '.pdf') fileType = 'application/pdf';
                                    
                                    downloadError = null; // Cleared by Local File
                                } catch (readErr) {
                                    console.error("Local file read error:", readErr);
                                }
                            } else {
                                // Try checking stripped filename in local?
                                const rawName = fileName.split('?')[0]; // Remove query string
                                const localFilePathRaw = path.join(process.cwd(), 'public/legacy_uploads', folderPath, rawName);
                                if (fs.existsSync(localFilePathRaw)) {
                                     console.log(`[Import] Found LOCAL file (raw): ${localFilePathRaw}`);
                                     fileData = fs.readFileSync(localFilePathRaw);
                                     fileType = 'image/jpeg'; // Default
                                     downloadError = null;
                                } else {
                                     // 3.1.3 Fallback: Recursive Search in legacy_uploads
                                     // (Ignore folder structure, find by filename)
                                     console.log(`[Import] Local exact match failed. Trying recursive search for: ${fileName}`);
                                     const legacyRoot = path.join(process.cwd(), 'public/legacy_uploads');
                                     const recursivePath = findFileRecursive(legacyRoot, fileName);
                                     
                                     if (recursivePath) {
                                         console.log(`[Import] Found RECURSIVE file: ${recursivePath}`);
                                         fileData = fs.readFileSync(recursivePath);
                                         // Guess Mime
                                         const ext = path.extname(recursivePath).toLowerCase();
                                         if (ext === '.jpg' || ext === '.jpeg') fileType = 'image/jpeg';
                                         else if (ext === '.png') fileType = 'image/png';
                                         else if (ext === '.gif') fileType = 'image/gif';
                                         else if (ext === '.webp') fileType = 'image/webp';
                                         
                                         downloadError = null;
                                     }
                                }
                            }
                       }
                  }
              }

              if (!downloadError && fileData) {
                  // 3.2 Upload to 'images' bucket (Content Image)
                  // Use a clean filename
                  const fileNameOnly = decodedPath.split('/').pop() || `image_${Date.now()}.jpg`;
                  // Sanitize filename and add random suffix
                  const cleanFileName = fileNameOnly.replace(/[^a-zA-Z0-9.-]/g, '_') + '_' + Math.random().toString(36).substring(7);
                  
                  const newPath = `editor/imported_${post.id}_${cleanFileName}`;
                  
                  // content type explicit
                  const { error: uploadError } = await supabase.storage
                      .from("images")
                      .upload(newPath, fileData, { upsert: true, contentType: fileType });

                  if (!uploadError) {
                      const { data: { publicUrl: newPublicUrl } } = supabase.storage
                          .from("images")
                          .getPublicUrl(newPath);

                      replacements.push({ original: src, new: newPublicUrl });
                      console.log(`[Import] Replaced ${src} -> ${newPublicUrl}`);

                      // 3.3 Handle Thumbnail (First Image)
                      if (!thumbnailUrl) {
                          // Upload deeper copy to og_images for Thumbnail
                          const thumbPath = `portfolio/imported_${post.id}_thumb_${cleanFileName}`;
                          const { error: thumbError } = await supabase.storage
                              .from("og_images")
                              .upload(thumbPath, fileData, { upsert: true, contentType: fileType });
                          
                          if (!thumbError) {
                              const { data: { publicUrl: thumbUrl } } = supabase.storage
                                  .from("og_images") // Using og_images for thumbnails
                                  .getPublicUrl(thumbPath);
                              thumbnailUrl = thumbUrl;
                          }
                      }
                  } else {
                      console.error(`[Import] Upload to images failed: ${uploadError.message}`);
                  }
              } else {
                  console.warn(`[Import] Failed to download migration image: ${decodedPath}`);
              }
          }
      }
  }

  // 4. Apply Replacements
  for (const rep of replacements) {
      content = content.replace(rep.original, rep.new);
  }

  // 5. Insert into Portfolios
  // User Request: Copy, do not delete original.
  const { error: insertError } = await supabase
    .from("portfolios")
    .insert({
      title: post.title,
      description: content,
      category: "Education", // Default category: Education (formerly Archive)
      client: "", // Unknown
      completion_date: post.date ? post.date.split('T')[0] : null,
      thumbnail_url: thumbnailUrl,
      is_visible: false // Draft for review
    });

  if (insertError) {
    throw new Error("포트폴리오 생성 실패: " + insertError.message);
  }

  // 6. NO DELETE (User Request: Copy mode)

  revalidatePath("/archive");
  revalidatePath("/admin/portfolio");

  return { success: true };
}
