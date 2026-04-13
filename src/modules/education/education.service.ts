import { prisma } from "../../config/prisma.js";
import { EducationQueryInput, SubjectQueryInput, DropdownQueryInput } from "./education.schema.js";

/**
 * Get all education level groups (Primary, Secondary, etc.)
 */
export async function getLevelGroups(is_active = true) {
  return prisma.educationLevelGroup.findMany({
    where: { is_active },
    orderBy: { sort_order: "asc" },
  });
}

/**
 * Get all education levels (Class 1, SSC, HSC, etc.)
 */
export async function getLevels(query: EducationQueryInput) {
  return prisma.educationLevel.findMany({
    where: {
      is_active: query.is_active,
      ...(query.group_id && { group_id: query.group_id }),
    },
    orderBy: { sort_order: "asc" },
    include: {
      group: {
        select: { name: true },
      },
    },
  });
}

/**
 * Optimized Dropdown: Levels
 */
export async function getLevelsDropdown(query: DropdownQueryInput) {
  const { page, limit, search, is_active } = query;
  const skip = (page - 1) * limit;

  const where = {
    is_active,
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.educationLevel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sort_order: "asc" },
      select: {
        id: true,
        name: true, // label
      },
    }),
    prisma.educationLevel.count({ where }),
  ]);

  return {
    data: data.map((item) => ({ id: item.id, label: item.name })),
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all subject categories (Science, Arts, Business, etc.)
 */
export async function getSubjectCategories(is_active = true) {
  return prisma.subjectCategory.findMany({
    where: { is_active },
    orderBy: { name: "asc" },
  });
}

/**
 * Get all subjects (Physics, Math, Accounting, etc.)
 */
export async function getSubjects(query: SubjectQueryInput) {
  return prisma.subject.findMany({
    where: {
      is_active: query.is_active,
      ...(query.category_id && { category_id: query.category_id }),
    },
    orderBy: { name: "asc" },
    include: {
      category: {
        select: { name: true },
      },
    },
  });
}

/**
 * Optimized Dropdown: Subjects
 */
export async function getSubjectsDropdown(query: DropdownQueryInput) {
  const { page, limit, search, is_active } = query;
  const skip = (page - 1) * limit;

  const where = {
    is_active,
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.subject.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true, // label
      },
    }),
    prisma.subject.count({ where }),
  ]);

  return {
    data: data.map((item) => ({ id: item.id, label: item.name })),
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}
