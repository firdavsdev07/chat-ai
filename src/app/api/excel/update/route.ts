import { updateCell } from "@/lib/excel";

export async function POST(req: Request) {
  try {
    const { sheet, cell, value } = await req.json();

    if (!sheet || !cell || value === undefined) {
      return Response.json({ error: "sheet, cell, ва value talab qilinadi" }, { status: 400 });
    }

    const result = updateCell(sheet, cell, value);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Xatolik" }, { status: 500 });
  }
}
