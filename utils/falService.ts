import { getFALKey } from './apiKeyService';

// FAL API base URL - using the synchronous endpoint for simpler implementation
const FAL_API_URL = 'https://fal.run/fal-ai/nano-banana';

// Generate image for a recipe using FAL REST API
export const generateRecipeImage = async (
  recipeTitle: string,
  ingredients: string[],
  accessToken: string
): Promise<string | null> => {
  try {
    const apiKey = await getFALKey(accessToken);
    if (!apiKey) {
      console.warn('No FAL API key configured');
      return null;
    }

    // Create a descriptive prompt for the recipe
    const mainIngredients = ingredients.slice(0, 3).join(', ');
    const prompt = `A beautiful, appetizing photo of ${recipeTitle}. The dish features ${mainIngredients}. Professional food photography, well-lit, restaurant quality presentation, high resolution, delicious looking.`;

    console.log('Generating image with prompt:', prompt);

    // Call the synchronous API endpoint
    const response = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        num_images: 1,
        output_format: 'jpeg',
        image_size: 'square',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FAL API error:', response.status, errorText);
      throw new Error(`FAL API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('FAL API response:', data);

    // Extract the image URL from the response
    if (data.images && data.images.length > 0) {
      const imageUrl = data.images[0].url;
      console.log('Image generated successfully:', imageUrl);
      return imageUrl;
    }

    console.warn('No image URL in response');
    return null;
  } catch (error) {
    console.error('Error generating recipe image:', error);
    return null;
  }
};

// Generate image with custom prompt
export const generateCustomImage = async (prompt: string, accessToken: string): Promise<string | null> => {
  try {
    const apiKey = await getFALKey(accessToken);
    if (!apiKey) {
      console.warn('No FAL API key configured');
      return null;
    }

    const response = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        num_images: 1,
        output_format: 'jpeg',
        image_size: 'square',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FAL API error:', response.status, errorText);
      throw new Error(`FAL API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.images && data.images.length > 0) {
      return data.images[0].url;
    }

    return null;
  } catch (error) {
    console.error('Error generating custom image:', error);
    return null;
  }
};
