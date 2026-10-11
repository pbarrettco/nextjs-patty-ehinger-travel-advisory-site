import { initBotId } from "botid/client/core";

// Server Actions POST to the page URL, so this covers the job application form.
initBotId({
    protect: [{ path: "/careers/*", method: "POST" }],
});
