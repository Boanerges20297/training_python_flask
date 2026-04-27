import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
  value?: string;
  onChange: (base64: string) => void;
  label?: string;
  helperText?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, label, helperText }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeImage = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div 
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${value ? styles.hasImage : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !value && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleInputChange} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />

        {value ? (
          <div className={styles.previewContainer}>
            <img src={value} alt="Preview" className={styles.previewImage} />
            <button type="button" className={styles.removeBtn} onClick={(e) => {
              e.stopPropagation();
              removeImage();
            }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.iconBox}>
              <Upload size={24} />
            </div>
            <div className={styles.text}>
              <p>Clique ou arraste uma foto</p>
              <span>PNG, JPG ou WEBP</span>
            </div>
          </div>
        )}
      </div>
      {helperText && <p className={styles.helperText}>{helperText}</p>}
    </div>
  );
};

export default ImageUpload;
