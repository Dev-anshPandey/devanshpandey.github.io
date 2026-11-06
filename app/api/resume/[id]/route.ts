import { knowledge } from "@/lib/retrieval";
import { makeResumePdf } from "@/lib/resume-pdf";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const resume = knowledge.resumes.find((r) => r.id === id);
  if (!resume)
    return Response.json(
      { error: "That resume is not available." },
      { status: 404 },
    );
  const bytes = await makeResumePdf(resume);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Devansh-Pandey-${id}.pdf"`,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
