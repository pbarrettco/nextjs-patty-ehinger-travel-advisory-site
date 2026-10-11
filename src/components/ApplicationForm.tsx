"use client";

import { useActionState, useState, type ChangeEvent, type FormEvent } from "react";

import { submitApplication } from "@/app/careers/[slug]/actions";
import {
    checkResumeFile,
    countWords,
    MAX_COVER_LETTER_WORDS,
    RESUME_ACCEPT,
    type ApplicationField,
    type ApplicationState,
} from "@/app/careers/[slug]/applicationRules";

type ApplicationFormProps = {
    slug: string;
    jobTitle: string;
};

const initialState: ApplicationState = { status: "idle" };

export default function ApplicationForm({ slug, jobTitle }: ApplicationFormProps) {
    const [state, formAction, pending] = useActionState(submitApplication, initialState);
    // The cover letter is controlled so the word counter stays live and its text
    // survives React's form reset after each submission.
    const [coverLetter, setCoverLetter] = useState("");
    const [resumeError, setResumeError] = useState<string | null>(null);

    const wordCount = countWords(coverLetter);
    const overWordLimit = wordCount > MAX_COVER_LETTER_WORDS;

    if (state.status === "success") {
        return (
            <div className="application-form application-form--success" role="status">
                <h2>Thank you</h2>
                <p>Your application for {jobTitle} has been sent. We&rsquo;ll be in touch.</p>
            </div>
        );
    }

    function handleResumeChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        setResumeError(file ? checkResumeFile(file) : null);
    }

    // Catch problems the browser can see before uploading. The server re-checks everything.
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        if (resumeError || overWordLimit) event.preventDefault();
    }

    const errors: Partial<Record<ApplicationField, string>> = {
        ...state.fieldErrors,
        ...(resumeError ? { resume: resumeError } : {}),
        ...(overWordLimit
            ? { coverLetter: `Cover letter must be ${MAX_COVER_LETTER_WORDS} words or fewer.` }
            : {}),
    };

    const errorProps = (field: ApplicationField) =>
        errors[field]
            ? { "aria-invalid": true, "aria-describedby": `application-${field}-error` }
            : {};

    const fieldError = (field: ApplicationField) =>
        errors[field] && (
            <p id={`application-${field}-error`} className="application-form__error">
                {errors[field]}
            </p>
        );

    return (
        <form className="application-form" action={formAction} onSubmit={handleSubmit}>
            <h2>Apply for this position</h2>

            <input type="hidden" name="slug" value={slug} />

            {/* Lock the fields while sending so edits can't drift from what was submitted. */}
            <fieldset className="application-form__fieldset" disabled={pending}>
                <div className="application-form__field">
                    <label htmlFor="application-name">Name</label>
                    <input
                        id="application-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        maxLength={100}
                        required
                        defaultValue={state.values?.name}
                        {...errorProps("name")}
                    />
                    {fieldError("name")}
                </div>

                <div className="application-form__field">
                    <label htmlFor="application-email">Email address</label>
                    <input
                        id="application-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        required
                        defaultValue={state.values?.email}
                        {...errorProps("email")}
                    />
                    {fieldError("email")}
                </div>

                <div className="application-form__field">
                    <label htmlFor="application-resume">Resume</label>
                    <input
                        id="application-resume"
                        name="resume"
                        type="file"
                        accept={RESUME_ACCEPT}
                        required
                        onChange={handleResumeChange}
                        {...errorProps("resume")}
                    />
                    <p className="application-form__hint">PDF or Word (.docx), up to 4MB.</p>
                    {fieldError("resume")}
                </div>

                <div className="application-form__field">
                    <label htmlFor="application-cover-letter">Cover letter (optional)</label>
                    <textarea
                        id="application-cover-letter"
                        name="coverLetter"
                        rows={8}
                        value={coverLetter}
                        onChange={(event) => setCoverLetter(event.target.value)}
                        {...errorProps("coverLetter")}
                    />
                    <p
                        className={`application-form__hint${overWordLimit ? " application-form__hint--over" : ""}`}
                        aria-live="polite"
                    >
                        {wordCount} / {MAX_COVER_LETTER_WORDS} words
                    </p>
                    {fieldError("coverLetter")}
                </div>
            </fieldset>

            {/* Honeypot: hidden from people, tempting to bots that fill every field. */}
            <div className="application-form__honeypot" aria-hidden="true">
                <label htmlFor="application-company">Company</label>
                <input id="application-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div aria-live="polite">
                {pending && <p className="application-form__visually-hidden">Sending your application…</p>}
                {state.status === "error" && state.message && (
                    <p className="application-form__error application-form__error--summary">{state.message}</p>
                )}
            </div>

            <button type="submit" className="application-form__submit" disabled={pending}>
                {pending ? (
                    <>
                        Sending
                        <span className="application-form__dots" aria-hidden="true">
                            ...
                        </span>
                    </>
                ) : (
                    "Submit application"
                )}
            </button>
        </form>
    );
}
