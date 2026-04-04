import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useSettings() {
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const updatePhotoUrl = useMutation(api.users.updatePhotoUrl);
  const removePhoto = useMutation(api.users.removePhoto);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleSaveName = async () => {
    if (!name.trim()) {
      setError("Nome não pode estar vazio");
      return;
    }

    try {
      setError(null);
      await updateProfile({ name: name.trim() });
      setIsUpdatingName(false);
    } catch (err) {
      setError("Falha ao atualizar nome");
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      setError(null);
      setUploadingPhoto(true);

      const postUrl = await generateUploadUrl();

      const response = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar foto");
      }

      const result = await response.json();
      const storageId: Id<"_storage"> = result.storageId;

      await updatePhotoUrl({
        storageId,
      });
    } catch (err) {
      setError("Falha ao enviar foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setError(null);
      await removePhoto();
    } catch (err) {
      setError("Falha ao remover foto");
    }
  };

  return {
    user,
    isUpdatingName,
    setIsUpdatingName,
    name,
    setName,
    uploadingPhoto,
    error,
    handleSaveName,
    handlePhotoUpload,
    handleRemovePhoto,
  };
}
