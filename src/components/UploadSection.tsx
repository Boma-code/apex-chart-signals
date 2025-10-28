import { useState } from "react";
import { Upload, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UploadSectionProps {
  onImageSelected: (image: File, assetType: string) => void;
  isAnalyzing: boolean;
}

export default function UploadSection({ onImageSelected, isAnalyzing }: UploadSectionProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<string>("forex");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    if (selectedImage) {
      onImageSelected(selectedImage, assetType);
    }
  };

  return (
    <Card className="p-8 bg-card shadow-card border-border">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Upload Your Chart</h2>
          <p className="text-muted-foreground">Select a chart image and choose your asset type</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Asset Type</label>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forex">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Forex
                  </div>
                </SelectItem>
                <SelectItem value="crypto">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Crypto
                  </div>
                </SelectItem>
                <SelectItem value="stocks">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Stocks
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="chart-upload" className="block text-sm font-medium mb-2">
              Chart Image
            </label>
            <div className="relative">
              <input
                id="chart-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="chart-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary transition-colors"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-12 w-12 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, or JPEG (MAX. 10MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!selectedImage || isAnalyzing}
            className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold shadow-glow"
            size="lg"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Chart"}
          </Button>
        </div>
      </div>
    </Card>
  );
}