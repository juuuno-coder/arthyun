"use server";

import { db, storage } from "@/lib/firebase";
import { collection, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Server Action to create a media Item
export async function createMedia(formData: FormData) {
  // 1. Extract Data
  const title = formData.get("title") as string;
  const press_name = formData.get("press_name") as string;
  const link_url = formData.get("link_url") as string;
  const published_date = formData.get("published_date") as string;
  const content = formData.get("content") as string;
  const imageFile = formData.get("image") as File;
  const imageUrlDirect = formData.get("image_url_direct") as string;

  let image_url = imageUrlDirect || null;

  try {
    // 2. Upload Image (Server-Side Fallback)
    if (!image_url && imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `media/${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `og_images/${fileName}`); // Maintain structure

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      await uploadBytes(storageRef, buffer, { contentType: imageFile.type });
      image_url = await getDownloadURL(storageRef);
    }

    // Fallback: Extract from content
    if (!image_url && content) {
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) {
        image_url = imgMatch[1];
        }
    }

    // 3. Insert DB (Firestore)
    // Firestore auto-generates ID.
    const docData: any = {
      title,
      press_name,
      link_url,
      published_date: published_date || null,
      content,
      image_url,
      created_at: new Date().toISOString(),
    };

    await addDoc(collection(db, "media_releases"), docData);

  } catch (error: any) {
    console.error("Create Media Error:", error);
    throw new Error("보도자료 등록 실패: " + error.message);
  }

  // 4. Revalidate & Redirect
  revalidatePath("/admin/media");
  revalidatePath("/media");
  redirect("/admin/media");
}

// Server Action to update a media Item
export async function updateMedia(id: string | number, formData: FormData) {
  const title = formData.get("title") as string;
  const press_name = formData.get("press_name") as string;
  const link_url = formData.get("link_url") as string;
  const published_date = formData.get("published_date") as string;
  const content = formData.get("content") as string;
  const imageFile = formData.get("image") as File;
  const imageUrlDirect = formData.get("image_url_direct") as string;

  let image_url = imageUrlDirect || null;

  try {
     // Upload if new file
     if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `media/${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, `og_images/${fileName}`);

        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        await uploadBytes(storageRef, buffer, { contentType: imageFile.type });
        image_url = await getDownloadURL(storageRef);
     }

     // Prepare Update Data
     const updateData: any = {
        title,
        press_name,
        link_url,
        published_date: published_date || null,
        content,
        updated_at: new Date().toISOString()
     };
     
     if (image_url) {
         updateData.image_url = image_url;
     }

     const docRef = doc(db, "media_releases", String(id));
     await updateDoc(docRef, updateData);

  } catch (error: any) {
    console.error("Update Media Error:", error);
    throw new Error("수정 실패: " + error.message);
  }

  revalidatePath("/admin/media");
  revalidatePath("/media");
  redirect("/admin/media");
}

// Server Action to delete a media Item
export async function deleteMedia(id: string | number) {
  try {
      const docRef = doc(db, "media_releases", String(id));
      await deleteDoc(docRef);

      revalidatePath("/admin/media");
      revalidatePath("/media");
      return { success: true };
  } catch (error: any) {
      console.error("Delete Media Error:", error);
      throw new Error("삭제 실패: " + error.message);
  }
}
