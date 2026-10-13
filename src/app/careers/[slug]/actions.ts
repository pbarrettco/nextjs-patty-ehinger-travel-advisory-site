"use server";

import { checkBotId } from "botid/server";
import { Resend } from "resend";

import { client } from "../../sanity/client";
import {
    checkResumeFile,
    countWords,
    MAX_COVER_LETTER_CHARS,
    MAX_COVER_LETTER_WORDS,
    MAX_EMAIL_CHARS,
    MAX_NAME_CHARS,
    type ApplicationState,
} from "./applicationRules";

const JOB_TITLE_QUERY = `*[_type == "careersPosting" && slug.current == $slug][0].jobTitle`;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_ERROR = "Sorry, something went wrong sending your application. Please try again.";

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Checks the file's first bytes so a renamed image or executable can't pass as a resume.
// PDFs start with "%PDF"; .docx files are zip archives starting with "PK\x03\x04".
function hasResumeSignature(bytes: Uint8Array, filename: string) {
    const head = Array.from(bytes.subarray(0, 4));
    if (filename.toLowerCase().endsWith(".pdf")) {
        return head.join() === [0x25, 0x50, 0x44, 0x46].join();
    }
    return head.join() === [0x50, 0x4b, 0x03, 0x04].join();
}

function safeFilename(name: string) {
    return name.replace(/[^\w.\- ]+/g, "_").slice(-120);
}

export async function submitApplication(
    _prevState: ApplicationState,
    formData: FormData,
): Promise<ApplicationState> {
    const verification = await checkBotId();
    if (verification.isBot) {
        return { status: "error", message: "Your submission could not be verified. Please try again." };
    }

    const values = {
        name: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        coverLetter: String(formData.get("coverLetter") ?? "").trim(),
    };

    // Honeypot: real visitors never see this field. Pretend success so bots learn nothing.
    if (String(formData.get("company") ?? "").trim()) {
        return { status: "success" };
    }

    const fieldErrors: ApplicationState["fieldErrors"] = {};

    if (!values.name) fieldErrors.name = "Please enter your name.";
    else if (values.name.length > MAX_NAME_CHARS) fieldErrors.name = "Name is too long.";

    if (!values.email) fieldErrors.email = "Please enter your email address.";
    else if (values.email.length > MAX_EMAIL_CHARS || !EMAIL_PATTERN.test(values.email)) {
        fieldErrors.email = "Please enter a valid email address.";
    }

    if (
        countWords(values.coverLetter) > MAX_COVER_LETTER_WORDS ||
        values.coverLetter.length > MAX_COVER_LETTER_CHARS
    ) {
        fieldErrors.coverLetter = `Cover letter must be ${MAX_COVER_LETTER_WORDS} words or fewer.`;
    }

    const resume = formData.get("resume");
    let resumeBytes: Uint8Array | null = null;
    if (!(resume instanceof File)) {
        fieldErrors.resume = "Please attach your resume.";
    } else {
        const fileError = checkResumeFile(resume);
        if (fileError) {
            fieldErrors.resume = fileError;
        } else {
            resumeBytes = new Uint8Array(await resume.arrayBuffer());
            if (!hasResumeSignature(resumeBytes, resume.name)) {
                fieldErrors.resume = "Resume must be a PDF or Word (.docx) file.";
            }
        }
    }

    if (Object.keys(fieldErrors).length > 0 || !(resume instanceof File) || !resumeBytes) {
        return { status: "error", message: "Please fix the highlighted fields.", fieldErrors, values };
    }

    // Look the job up again rather than trusting a title sent from the browser.
    const slug = String(formData.get("slug") ?? "");
    const jobTitle = slug ? await client.fetch<string | null>(JOB_TITLE_QUERY, { slug }) : null;
    if (!jobTitle) {
        return { status: "error", message: "This job posting is no longer available.", values };
    }

    const { RESEND_API_KEY, CAREERS_TO_EMAIL, CAREERS_FROM_EMAIL } = process.env;
    if (!RESEND_API_KEY || !CAREERS_TO_EMAIL || !CAREERS_FROM_EMAIL) {
        console.error("Job application: RESEND_API_KEY, CAREERS_TO_EMAIL or CAREERS_FROM_EMAIL is not set.");
        return { status: "error", message: GENERIC_ERROR, values };
    }

    const coverLetter = values.coverLetter || "No cover letter provided.";
    const text = [
        `Position: ${jobTitle}`,
        `Name: ${values.name}`,
        `Email: ${values.email}`,
        "",
        "Cover letter:",
        coverLetter,
    ].join("\n");
    const html = `
        <p><strong>Position:</strong> ${escapeHtml(jobTitle)}</p>
        <p><strong>Name:</strong> ${escapeHtml(values.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(values.email)}</p>
        <p><strong>Cover letter:</strong></p>
        <p style="white-space: pre-wrap">${escapeHtml(coverLetter)}</p>
    `;

    try {
        const resend = new Resend(RESEND_API_KEY);
        const { error } = await resend.emails.send({
            from: CAREERS_FROM_EMAIL,
            to: CAREERS_TO_EMAIL.split(",").map((address) => address.trim()).filter(Boolean),
            replyTo: values.email,
            subject: `Application: ${jobTitle} — ${values.name}`,
            text,
            html,
            attachments: [{ filename: safeFilename(resume.name), content: Buffer.from(resumeBytes) }],
        });
        if (error) {
            console.error("Job application: Resend error", error);
            return { status: "error", message: GENERIC_ERROR, values };
        }
    } catch (err) {
        console.error("Job application: send failed", err);
        return { status: "error", message: GENERIC_ERROR, values };
    }

    return { status: "success" };
}
