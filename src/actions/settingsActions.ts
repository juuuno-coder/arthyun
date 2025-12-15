"use server";

import { db, storage } from "@/lib/firebase"; // storage needed
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { revalidatePath } from "next/cache";

// 설정 조회
export async function getSiteSettings() {
  try {
    const docRef = doc(db, "site_settings", "1");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
}

// 설정 업데이트
export async function updateSiteSettings(formData: FormData) {
  // Auth check omitted (Relies on Client-side protection for now)
  // In production, send ID token and verify with firebase-admin

  const description = formData.get("description") as string;
  const imageFile = formData.get("image") as File;
  let imageUrl = formData.get("existingImage") as string;

  try {
    // 새 이미지가 업로드된 경우
    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `og-image-${Date.now()}.${fileExt}`;
      const filePath = `settings/${fileName}`;
      
      const storageRef = ref(storage, `og_images/${filePath}`);
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      await uploadBytes(storageRef, buffer, { contentType: imageFile.type });
      imageUrl = await getDownloadURL(storageRef);
    }

    // DB 업데이트
    await setDoc(doc(db, "site_settings", "1"), {
        id: 1,
        og_description: description,
        og_image_url: imageUrl,
        updated_at: new Date().toISOString(),
    }, { merge: true });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    
    return { success: true };

  } catch (e: any) {
      console.error("Settings update failed", e);
      return { error: e.message };
  }
}
