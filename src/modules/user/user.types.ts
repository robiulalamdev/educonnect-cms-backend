export const USER_ROLE_OBJECT = {
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  GUARDIAN: "GUARDIAN",
} as const;

export const USER_STATUS_OBJECT = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
} as const;

export const GENDER_OBJECT = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;

export const USER_TYPES = {
  ROLES: ["TEACHER", "STUDENT", "GUARDIAN"] as const,
  STATUS: ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "BANNED"] as const,
  GENDERS: ["MALE", "FEMALE", "OTHER"] as const,
  
  ROLE_OBJECT: USER_ROLE_OBJECT,
  STATUS_OBJECT: USER_STATUS_OBJECT,
  GENDER_OBJECT: GENDER_OBJECT,
} as const;

export type IUserRole = (typeof USER_ROLE_OBJECT)[keyof typeof USER_ROLE_OBJECT];
export type IUserStatus = (typeof USER_STATUS_OBJECT)[keyof typeof USER_STATUS_OBJECT];
export type IGender = (typeof GENDER_OBJECT)[keyof typeof GENDER_OBJECT];
