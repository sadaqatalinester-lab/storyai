/**
 * Leonardo AI API Service
 * Provides image generation and API key validation for Leonardo AI
 */

const LEONARDO_API_BASE = 'https://cloud.leonardo.ai/api/rest/v1';

/**
 * Validates a Leonardo AI API Key by making a minimal request.
 */
export const validateLeonardoApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        // Test the API key by fetching user information
        const response = await fetch(`${LEONARDO_API_BASE}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn("Leonardo Key Validation Failed:", response.status, response.statusText);
            return false;
        }

        const data = await response.json();
        console.log("Leonardo API Key validated successfully:", data);
        return true;
    } catch (error: any) {
        console.warn("Leonardo Key Validation Failed:", error);
        return false;
    }
};

/**
 * Generates an image using Leonardo AI
 */
export const generateImageWithLeonardo = async (
    prompt: string,
    apiKey: string,
    width: number = 1024,
    height: number = 1024
): Promise<Blob> => {
    if (!apiKey) throw new Error("Leonardo API Key is required");

    try {
        // Step 1: Create generation request
        const generationResponse = await fetch(`${LEONARDO_API_BASE}/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                num_images: 1,
                width: width,
                height: height,
                modelId: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', // Leonardo Diffusion XL
                alchemy: true, // Enable high quality mode
            }),
        });

        if (!generationResponse.ok) {
            const errorText = await generationResponse.text();
            throw new Error(`Leonardo generation failed: ${generationResponse.status} - ${errorText}`);
        }

        const generationData = await generationResponse.json();
        const generationId = generationData.sdGenerationJob.generationId;

        // Step 2: Poll for completion
        let imageUrl: string | null = null;
        let attempts = 0;
        const maxAttempts = 60; // 60 attempts x 2 seconds = 2 minutes max wait

        while (!imageUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

            const statusResponse = await fetch(`${LEONARDO_API_BASE}/generations/${generationId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!statusResponse.ok) {
                throw new Error(`Failed to check generation status: ${statusResponse.status}`);
            }

            const statusData = await statusResponse.json();
            const generation = statusData.generations_by_pk;

            if (generation.status === 'COMPLETE' && generation.generated_images?.length > 0) {
                imageUrl = generation.generated_images[0].url;
            } else if (generation.status === 'FAILED') {
                throw new Error('Leonardo image generation failed');
            }

            attempts++;
        }

        if (!imageUrl) {
            throw new Error('Leonardo image generation timed out');
        }

        // Step 3: Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`);
        }

        return await imageResponse.blob();
    } catch (error: any) {
        console.error("Leonardo image generation failed", error);
        throw error;
    }
};
