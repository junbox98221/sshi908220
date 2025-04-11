import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ experimentId: string }> }
) {
  try {
    const { experimentId } = await params;
    const { ratings } = await req.json();

    if (
      !experimentId ||
      !Array.isArray(ratings) ||
      ratings.length !== 21 ||
      !ratings.every(
        (r) =>
          r.wordId &&
          typeof r.relevance === "number" &&
          typeof r.negativePositive === "number" &&
          typeof r.timePerspective === "number" &&
          typeof r.voluntary === "number"
      )
    ) {
      return NextResponse.json(
        { error: "Invalid experiment ID or ratings array structure" },
        { status: 400 }
      );
    }

    const ratingEntries = ratings.map((r) => ({
      experimentId,
      wordId: r.wordId,
      relevance: r.relevance,
      negativePositive: r.negativePositive,
      timePerspective: r.timePerspective,
      voluntary: r.voluntary,
    }));

    await prisma.rating.createMany({ data: ratingEntries });

    return NextResponse.json(
      { message: "Ratings saved successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving experiment ratings:", error);
    return NextResponse.json(
      { error: "Error saving experiment ratings" },
      { status: 500 }
    );
  }
}
