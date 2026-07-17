import type { Octokit } from "octokit";
import type { DiffFile } from "@/lib/diff/filter";

type ListFilesResponse = Awaited<
  ReturnType<Octokit["rest"]["pulls"]["listFiles"]>
>["data"];

export async function fetchPullRequestFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<DiffFile[]> {
  const files: DiffFile[] = [];

  // Paginate — large PRs can exceed a single page
  for await (const response of octokit.paginate.iterator(
    octokit.rest.pulls.listFiles,
    {
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    },
  )) {
    for (const file of response.data as ListFilesResponse) {
      files.push({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
      });
    }
  }

  return files;
}

export async function postPullRequestComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
): Promise<{ id: number; html_url: string }> {
  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });

  return {
    id: data.id,
    html_url: data.html_url,
  };
}
