import type { DiffFile } from "@/lib/diff/filter";

/** Sample diff used when PR_ASSISTANT_DRY_RUN=true (no GitHub API). */
export const SAMPLE_DIFF_FILES: DiffFile[] = [
  {
    filename: "src/utils/fetchUser.ts",
    status: "modified",
    additions: 18,
    deletions: 4,
    changes: 22,
    patch: `@@ -1,12 +1,26 @@
 export async function fetchUser(id: string) {
-  const res = await fetch(\`/api/users/\${id}\`)
-  return res.json()
+  const res = await fetch(\`/api/users/\${id}\`)
+  // TODO: handle non-200 responses
+  const data = await res.json()
+  return data
 }
 
 export function formatName(user: { first: string; last: string }) {
-  return user.first + ' ' + user.last
+  const n = user.first + ' ' + user.last
+  return n
 }
 
+export function formatNameDup(user: { first: string; last: string }) {
+  const n = user.first + ' ' + user.last
+  return n
+}
+
+export async function deleteUser(id: string) {
+  await fetch(\`/api/users/\${id}\`, { method: 'DELETE' })
+}`,
  },
  {
    filename: "package-lock.json",
    status: "modified",
    additions: 500,
    deletions: 20,
    changes: 520,
    patch: "@@ -1,3 +1,3 @@\n { \"lockfileVersion\": 3 }",
  },
  {
    filename: "pnpm-lock.yaml",
    status: "modified",
    additions: 200,
    deletions: 10,
    changes: 210,
    patch: "@@ -1,2 +1,2 @@\n lockfileVersion: '9.0'",
  },
];
