/**
 * API Validation Services for Audio and Video Engines
 */

/**
 * Validates ElevenLabs API Key
 */
export const validateElevenLabsApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        // Test the API key by fetching user info
        const response = await fetch('https://api.elevenlabs.io/v1/user', {
            method: 'GET',
            headers: {
                'xi-api-key': apiKey,
            },
        });

        if (!response.ok) {
            console.warn("ElevenLabs Key Validation Failed:", response.status, response.statusText);
            return false;
        }

        const data = await response.json();
        console.log("ElevenLabs API Key validated successfully:", data);
        return true;
    } catch (error: any) {
        console.warn("ElevenLabs Key Validation Failed:", error);
        return false;
    }
};

/**
 * Validates Kling AI API Key
 */
export const validateKlingApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        // Kling AI API validation endpoint
        // Note: This is a placeholder - actual endpoint may vary
        const response = await fetch('https://api.klingai.com/v1/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn("Kling AI Key Validation Failed:", response.status, response.statusText);
            return false;
        }

        return true;
    } catch (error: any) {
        console.warn("Kling AI Key Validation Failed:", error);
        return false;
    }
};

/**
 * Validates Hailuo AI API Key
 */
export const validateHailuoApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        // Hailuo AI API validation endpoint
        // Note: This is a placeholder - actual endpoint may vary
        const response = await fetch('https://api.hailuoai.com/v1/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn("Hailuo AI Key Validation Failed:", response.status, response.statusText);
            return false;
        }

        return true;
    } catch (error: any) {
        console.warn("Hailuo AI Key Validation Failed:", error);
        return false;
    }
};

/**
 * Validates Sora (OpenAI) API Key
 */
export const validateSoraApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        // Use OpenAI's models endpoint to validate
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn("Sora (OpenAI) Key Validation Failed:", response.status, response.statusText);
            return false;
        }

        const data = await response.json();
        console.log("Sora (OpenAI) API Key validated successfully");
        return true;
    } catch (error: any) {
        console.warn("Sora (OpenAI) Key Validation Failed:", error);
        return false;
    }
};
