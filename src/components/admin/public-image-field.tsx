"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";

interface PublicImageFieldProps {
  defaultValue?: string;
  label: string;
  name: string;
}

export function PublicImageField({ defaultValue = "", label, name }: PublicImageFieldProps) {
  const [url, setUrl] = useState(defaultValue);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setMessage("Use an image smaller than 8 MB.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/admin/site-images", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Image upload failed.");
      setUrl(payload.url);
      setMessage("Image uploaded. Save the page to publish it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="field full public-image-field">
      <span>{label}</span>
      <div className="public-image-field-grid">
        {url ? <Image src={url} alt="" width={220} height={140} unoptimized /> : <div className="image-placeholder"><ImagePlus /></div>}
        <div>
          <input name={name} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Upload an image or paste its URL" />
          <label className="button button-outline button-small image-upload-button">
            {uploading ? <LoaderCircle className="spin" size={16} /> : <ImagePlus size={16} />}
            {uploading ? "Uploading" : "Choose image"}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} />
          </label>
          {message && <small className="form-message">{message}</small>}
        </div>
      </div>
    </div>
  );
}
