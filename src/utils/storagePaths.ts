/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFileExtension } from './upload.utils';

export type CourseStorageInput = {
  tenantName?: string | null;
  tenantSlug?: string | null;
  tenantId?: string | null;
  courseTitle?: string | null;
  courseSlug?: string | null;
  courseId?: string | null;
};

export type CourseStorageContext = {
  tenantName: string;
  tenantSlug: string;
  tenantId?: string | null;
  courseTitle: string;
  courseSlug: string;
  courseId?: string | null;
  storageBasePath: string;
};

export const slugifySegment = (value?: string | null, fallback = 'item'): string => {
  const normalized = (value || fallback).toString().toLowerCase().trim();
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
  return slug || fallback;
};

export const buildCourseStorageContext = (input: CourseStorageInput): CourseStorageContext => {
  const tenantName = (input.tenantName || 'Tenant').trim();
  const courseTitle = (input.courseTitle || 'Course').trim();
  const tenantSlug = slugifySegment(input.tenantSlug || tenantName, 'tenant');
  const courseSlug = slugifySegment(input.courseSlug || courseTitle, 'course');
  return {
    tenantName,
    tenantSlug,
    tenantId: input.tenantId,
    courseTitle,
    courseSlug,
    courseId: input.courseId,
    storageBasePath: `sunlms-blob/tenants/${tenantSlug}/courses/${courseSlug}`,
  };
};

export const buildCourseUploadPayload = (
  context: CourseStorageContext,
  extra?: Record<string, any>
): Record<string, any> => {
  return {
    tenantName: context.tenantName,
    tenantSlug: context.tenantSlug,
    tenantId: context.tenantId || undefined,
    courseTitle: context.courseTitle,
    courseSlug: context.courseSlug,
    courseId: context.courseId || undefined,
    storagePath: context.storageBasePath,
    ...extra,
  };
};

const getFileExtensionFromFile = (file: File): string => {
  const existing = getFileExtension(file.name);
  if (existing) return existing.toLowerCase();
  if (file.type) {
    const typeExt = file.type.split('/').pop();
    if (typeExt) {
      return typeExt.toLowerCase();
    }
  }
  return '';
};

export const renameFileForCourse = (file: File, lessonTitle: string): File => {
  const lessonSlug = slugifySegment(lessonTitle, 'lesson');
  const extension = getFileExtensionFromFile(file);
  const desiredName = extension ? `${lessonSlug}.${extension}` : lessonSlug;
  if (file.name === desiredName) {
    return file;
  }
  return new File([file], desiredName, { type: file.type, lastModified: file.lastModified });
};

