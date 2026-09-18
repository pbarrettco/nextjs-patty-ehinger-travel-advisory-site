import { createClient } from "next-sanity";

export const client = createClient({
    projectId: "rt5z0tbn",
    dataset: "production",
    apiVersion: "2026-05-15",
    useCdn: false,
})