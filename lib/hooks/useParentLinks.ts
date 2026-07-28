"use client";

/**
 * Sisi ADMIN dari Parent Portal -- listen seluruh `parent_links` (admin
 * boleh baca semua, beda dengan parent yang cuma boleh baca link
 * miliknya sendiri lewat token) + buat/hapus link baru.
 */
import { useCallback, useEffect, useState } from "react";
import { ref, onValue, set as firebaseSet, remove } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";
import type { ParentLink, ParentLinksNode } from "@/types/firebase-schema";

export interface ParentLinkWithToken extends ParentLink {
  token: string;
}

interface CreateLinkInput {
  nisn: string;
  studentName: string;
  studentClass: string;
  parentName: string;
  parentPhone: string;
}

interface UseParentLinksResult {
  links: ParentLinkWithToken[];
  loading: boolean;
  error: string | null;
  createLink: (input: CreateLinkInput) => Promise<string>; // balikin token baru
  deleteLink: (token: string) => Promise<void>;
}

function generateToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  // Fallback jarang kepakai (browser sangat lama) -- tetap random & panjang.
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

export function useParentLinks(): UseParentLinksResult {
  const [links, setLinks] = useState<ParentLinkWithToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();
    const linksRef = ref(db, "parent_links");
    const unsubscribe = onValue(
      linksRef,
      (snapshot) => {
        const data: ParentLinksNode | null = snapshot.val();
        const list = data ? Object.entries(data).map(([token, link]) => ({ token, ...link })) : [];
        list.sort((a, b) => b.created_at.localeCompare(a.created_at));
        setLinks(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const createLink = useCallback(async (input: CreateLinkInput) => {
    const token = generateToken();
    const db = getFirebaseDb();
    const link: ParentLink = {
      nisn: input.nisn,
      student_name: input.studentName,
      student_class: input.studentClass,
      parent_name: input.parentName,
      parent_phone: input.parentPhone,
      uid: null,
      created_at: new Date().toISOString(),
    };
    await firebaseSet(ref(db, `parent_links/${token}`), link);
    return token;
  }, []);

  const deleteLink = useCallback(async (token: string) => {
    const db = getFirebaseDb();
    await remove(ref(db, `parent_links/${token}`));
  }, []);

  return { links, loading, error, createLink, deleteLink };
}
