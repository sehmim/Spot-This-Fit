import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "videoSearches";

interface VideoSearchDoc {
  videoUrl: string;
  frames: string[];
}

/**
 * Save a video search to Firestore. If the videoUrl already exists, returns
 * the existing document ID instead of creating a duplicate.
 */
export async function saveVideoSearch(
  videoUrl: string,
  frames: string[],
): Promise<string> {
  const existing = await getVideoSearchByUrl(videoUrl);
  if (existing) return existing.id;

  const ref = await addDoc(collection(db, COLLECTION), {
    videoUrl,
    frames,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Look up a video search by its Firestore document ID.
 */
export async function getVideoSearchById(
  id: string,
): Promise<VideoSearchDoc | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { videoUrl: data.videoUrl, frames: data.frames };
}

/**
 * Look up a video search by the original video URL.
 */
export async function getVideoSearchByUrl(
  videoUrl: string,
): Promise<(VideoSearchDoc & { id: string }) | null> {
  const q = query(
    collection(db, COLLECTION),
    where("videoUrl", "==", videoUrl),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  const data = docSnap.data();
  return { id: docSnap.id, videoUrl: data.videoUrl, frames: data.frames };
}
