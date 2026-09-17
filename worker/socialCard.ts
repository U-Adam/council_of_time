const SOCIAL_CARD_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wAARCAE7AlgDASIAAhEBAxEB/8QAGgABAQADAQEAAAAAAAAAAAAAAAEDBAUCBv/EAEEQAAICAQEEBwYDBQcFAAMAAAABAgMRBAUSIVETMTJBYZGhBhQiU3HBRIOxFTNSgdEjNDVCcnPwJGKC4fE2dJL/xAAXAQEBAQEAAAAAAAAAAAAAAAAAAQID/8QAHxEBAQADAQEBAQADAAAAAAAAAAECESExEkEyIlFh/9oADAMBAAIRAxEAPwD54AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABLJcLn6BdTIBcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hABcLn6DC5+hAAawCvsogAAAAABV2WQq7LIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEf/Z";

let cachedSocialCard: Uint8Array | null = null;

function decodeSocialCard() {
  if (cachedSocialCard) return cachedSocialCard;
  const binary = atob(SOCIAL_CARD_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  cachedSocialCard = bytes;
  return bytes;
}

export function socialCardResponse() {
  return new Response(decodeSocialCard(), {
    headers: {
      "content-type": "image/jpeg",
      "content-length": String(decodeSocialCard().byteLength),
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
