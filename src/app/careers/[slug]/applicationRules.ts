// Limits shared by the application form (client-side hints) and the
// submitApplication Server Action (the source of truth).

// Vercel functions reject request bodies over 4.5MB, so resumes stay under 4MB.
export const MAX_RESUME_BYTES = 4 * 1024 * 1024;
export const MAX_COVER_LETTER_WORDS = 300;
export const MAX_COVER_LETTER_CHARS = 3000;
export const MAX_NAME_CHARS = 100;
export const MAX_EMAIL_CHARS = 254;

export const RESUME_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export const RESUME_ACCEPT = [...Object.keys(RESUME_TYPES), ...Object.values(RESUME_TYPES)].join(",");

export type ApplicationField = "name" | "email" | "resume" | "coverLetter";

export type ApplicationState = {
    status: "idle" | "success" | "error";
    message?: string;
    fieldErrors?: Partial<Record<ApplicationField, string>>;
    values?: { name: string; email: string; coverLetter: string };
};

export function countWords(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

// Returns an error message, or null if the file looks acceptable. Content
// (magic bytes) is checked separately on the server.
export function checkResumeFile(file: File): string | null {
    if (file.size === 0) return "Please attach your resume.";
    if (file.size > MAX_RESUME_BYTES) return "Resume must be 4MB or smaller.";

    const name = file.name.toLowerCase();
    const ext = Object.keys(RESUME_TYPES).find((e) => name.endsWith(e)) as keyof typeof RESUME_TYPES | undefined;
    // Some browsers report an empty type, so only reject a type that's present and wrong.
    if (!ext || (file.type && file.type !== RESUME_TYPES[ext])) {
        return "Resume must be a PDF or Word (.docx) file.";
    }
    return null;
}
