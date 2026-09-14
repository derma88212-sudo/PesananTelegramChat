/**
 * Safe fetch utility to prevent "Unexpected end of JSON input" errors
 * Handles empty responses, non-JSON responses, and HTTP errors gracefully
 */

export interface SafeFetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const response = await fetch(url, options);
    
    // Check if response is ok (status 200-299)
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          // Try to parse as JSON for structured error
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
        }
      } catch {}
      return { success: false, error: errorMessage, status: response.status };
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return { success: true, data: {} as T, status: response.status };
      }
      try {
        const data = JSON.parse(text);
        return { success: true, data, status: response.status };
      } catch (e) {
        return { 
          success: false, 
          error: 'Invalid JSON response from server', 
          status: response.status 
        };
      }
    }

    // For non-JSON responses, return text
    const text = await response.text();
    return { success: true, data: text as unknown as T, status: response.status };
  } catch (err: any) {
    return { 
      success: false, 
      error: err.message || 'Network error', 
      status: 0 
    };
  }
}

// Convenience methods
export const safeGet = <T>(url: string) => safeFetch<T>(url, { method: 'GET' });
export const safePost = <T>(url: string, body?: any) => safeFetch<T>(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: body ? JSON.stringify(body) : undefined
});
export const safePut = <T>(url: string, body?: any) => safeFetch<T>(url, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: body ? JSON.stringify(body) : undefined
});
export const safePatch = <T>(url: string, body?: any) => safeFetch<T>(url, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: body ? JSON.stringify(body) : undefined
});
export const safeDelete = <T>(url: string) => safeFetch<T>(url, { method: 'DELETE' });