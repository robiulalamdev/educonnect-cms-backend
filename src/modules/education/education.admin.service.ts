import { prisma } from "../../config/prisma.js";

// ── Level Groups CRUD ──────────────────────────────────────

export async function createLevelGroup(input: { name: string; sort_order?: number }) {
  const existing = await prisma.educationLevelGroup.findUnique({ where: { name: input.name } });
  if (existing) throw new Error("NAME_TAKEN");

  return prisma.educationLevelGroup.create({
    data: { name: input.name, sort_order: input.sort_order ?? 0 },
  });
}

export async function updateLevelGroup(id: string, input: { name?: string; sort_order?: number; is_active?: boolean }) {
  const group = await prisma.educationLevelGroup.findUnique({ where: { id } });
  if (!group) throw new Error("NOT_FOUND");

  if (input.name && input.name !== group.name) {
    const existing = await prisma.educationLevelGroup.findUnique({ where: { name: input.name } });
    if (existing) throw new Error("NAME_TAKEN");
  }

  return prisma.educationLevelGroup.update({ where: { id }, data: input });
}

export async function deleteLevelGroup(id: string) {
  const group = await prisma.educationLevelGroup.findUnique({
    where: { id },
    select: { _count: { select: { levels: true } } },
  });
  if (!group) throw new Error("NOT_FOUND");
  if (group._count.levels > 0) throw new Error("HAS_CHILDREN");

  await prisma.educationLevelGroup.delete({ where: { id } });
}

// ── Levels CRUD ────────────────────────────────────────────

export async function createLevel(input: { group_id: string; name: string; sort_order?: number }) {
  const group = await prisma.educationLevelGroup.findUnique({ where: { id: input.group_id } });
  if (!group) throw new Error("GROUP_NOT_FOUND");

  return prisma.educationLevel.create({
    data: { group_id: input.group_id, name: input.name, sort_order: input.sort_order ?? 0 },
  });
}

export async function updateLevel(id: string, input: { name?: string; sort_order?: number; is_active?: boolean }) {
  const level = await prisma.educationLevel.findUnique({ where: { id } });
  if (!level) throw new Error("NOT_FOUND");

  return prisma.educationLevel.update({ where: { id }, data: input });
}

export async function deleteLevel(id: string) {
  const level = await prisma.educationLevel.findUnique({ where: { id } });
  if (!level) throw new Error("NOT_FOUND");

  await prisma.educationLevel.delete({ where: { id } });
}

// ── Subject Categories CRUD ────────────────────────────────

export async function createSubjectCategory(input: { name: string }) {
  const existing = await prisma.subjectCategory.findUnique({ where: { name: input.name } });
  if (existing) throw new Error("NAME_TAKEN");

  return prisma.subjectCategory.create({ data: { name: input.name } });
}

export async function updateSubjectCategory(id: string, input: { name?: string; is_active?: boolean }) {
  const category = await prisma.subjectCategory.findUnique({ where: { id } });
  if (!category) throw new Error("NOT_FOUND");

  if (input.name && input.name !== category.name) {
    const existing = await prisma.subjectCategory.findUnique({ where: { name: input.name } });
    if (existing) throw new Error("NAME_TAKEN");
  }

  return prisma.subjectCategory.update({ where: { id }, data: input });
}

export async function deleteSubjectCategory(id: string) {
  const category = await prisma.subjectCategory.findUnique({
    where: { id },
    select: { _count: { select: { subjects: true } } },
  });
  if (!category) throw new Error("NOT_FOUND");
  if (category._count.subjects > 0) throw new Error("HAS_CHILDREN");

  await prisma.subjectCategory.delete({ where: { id } });
}

// ── Subjects CRUD ──────────────────────────────────────────

export async function createSubject(input: { category_id: string; name: string }) {
  const category = await prisma.subjectCategory.findUnique({ where: { id: input.category_id } });
  if (!category) throw new Error("CATEGORY_NOT_FOUND");

  return prisma.subject.create({
    data: { category_id: input.category_id, name: input.name },
  });
}

export async function updateSubject(id: string, input: { name?: string; is_active?: boolean }) {
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) throw new Error("NOT_FOUND");

  return prisma.subject.update({ where: { id }, data: input });
}

export async function deleteSubject(id: string) {
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) throw new Error("NOT_FOUND");

  await prisma.subject.delete({ where: { id } });
}
