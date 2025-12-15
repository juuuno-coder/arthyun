"use server";

import { db, storage } from "@/lib/firebase";
import { collection, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Server Action to create a portfolio
export async function createPortfolio(formData: FormData) {
  // 1. Extract Data
  const title = formData.get("title") as string;
  const client = formData.get("client") as string;
  const category = formData.get("category") as string;
  const completion_date = formData.get("completion_date") as string;
  const description = formData.get("description") as string;
  const thumbnailFile = formData.get("thumbnail") as File;
  const thumbnailUrlDirect = formData.get("thumbnail_url_direct") as string;

  let thumbnail_url = thumbnailUrlDirect || null;

  try {
    // 2. Upload Thumbnail (Server-Side Fallback)
    if (!thumbnail_url && thumbnailFile && thumbnailFile.size > 0) {
      const fileExt = thumbnailFile.name.split(".").pop();
      const fileName = `portfolio/${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `og_images/${fileName}`);

      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      await uploadBytes(storageRef, buffer, { contentType: thumbnailFile.type });
      thumbnail_url = await getDownloadURL(storageRef);
    }

    // 3. Insert DB
    const docData = {
      title,
      client,
      location: null,
      completion_date: completion_date || null,
      category,
      description,
      thumbnail_url,
      is_visible: true,
      created_at: new Date().toISOString(),
    };

    await addDoc(collection(db, "portfolios"), docData);

  } catch (error: any) {
    console.error("Create Portfolio Error:", error);
    throw new Error("포트폴리오 등록 실패: " + error.message);
  }

  // 4. Revalidate
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  redirect("/admin/portfolio");
}

// Server Action to update a portfolio
export async function updatePortfolio(id: string | number, formData: FormData) {
  // 1. Extract Data
  const title = formData.get("title") as string;
  const client = formData.get("client") as string;
  const category = formData.get("category") as string;
  const completion_date = formData.get("completion_date") as string;
  const description = formData.get("description") as string;
  const thumbnailFile = formData.get("thumbnail") as File;
  const thumbnailUrlDirect = formData.get("thumbnail_url_direct") as string;

  let thumbnail_url = thumbnailUrlDirect || null; // If null, means no change OR removed?
  // Logic: passing existing URL if not changed?
  // We need to know if we should KEEP existing image if no new one provided.
  // Generally Edit forms pass the 'existing' URL back or we handle it here.
  // Let's assume the Client sends 'thumbnail_url_direct' as the EXISTING URL if no new file.
  
  try {
     // Upload if new file
     if (thumbnailFile && thumbnailFile.size > 0) {
        const fileExt = thumbnailFile.name.split(".").pop();
        const fileName = `portfolio/${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, `og_images/${fileName}`);

        const arrayBuffer = await thumbnailFile.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        await uploadBytes(storageRef, buffer, { contentType: thumbnailFile.type });
        thumbnail_url = await getDownloadURL(storageRef);
     }

     // Prepare Update Data
     const updateData: any = {
        title,
        client,
        completion_date: completion_date || null,
        category,
        description,
        updated_at: new Date().toISOString()
     };
     
     if (thumbnail_url) {
         updateData.thumbnail_url = thumbnail_url;
     }

     const docRef = doc(db, "portfolios", String(id));
     await updateDoc(docRef, updateData);

  } catch (error: any) {
    console.error("Update Portfolio Error:", error);
    throw new Error("수정 실패: " + error.message);
  }

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  redirect("/admin/portfolio");
}


// Server Action to delete a portfolio
export async function deletePortfolio(id: string | number) {
  try {
    const docRef = doc(db, "portfolios", String(id));
    await deleteDoc(docRef);

    revalidatePath("/admin/portfolio");
    revalidatePath("/portfolio");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Portfolio Error:", error);
    throw new Error("삭제 실패: " + error.message);
  }
}
