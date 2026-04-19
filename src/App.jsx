import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

function LogoCombinerApp() {
  const canvasRef = useRef(null);
  const [file1Url, setFile1Url] = useState(null);
  const [file2Url, setFile2Url] = useState(null);
  const [padding, setPadding] = useState([24]);
  const [size, setSize] = useState([512]);
  const [divider, setDivider] = useState([8]);
  const [background, setBackground] = useState("#ffffff");
  const [mode, setMode] = useState("diagonal");

  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const drawImageContain = (ctx, img, x, y, width, height, innerPadding = 0) => {
    const areaX = x + innerPadding;
    const areaY = y + innerPadding;
    const areaW = width - innerPadding * 2;
    const areaH = height - innerPadding * 2;

    const scale = Math.min(areaW / img.width, areaH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const dx = areaX + (areaW - drawW) / 2;
    const dy = areaY + (areaH - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
  };

  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const outputSize = size[0];
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.clearRect(0, 0, outputSize, outputSize);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, outputSize, outputSize);

    const [img1, img2] = await Promise.all([loadImage(file1Url), loadImage(file2Url)]);
    const outerPadding = padding[0];
    const dividerWidth = divider[0];
    const contentSize = outputSize - outerPadding * 2;

    if (!img1 && !img2) {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(outerPadding, outerPadding, contentSize, contentSize);
      ctx.fillStyle = "#475569";
      ctx.font = `${Math.round(outputSize * 0.04)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("画像を2枚アップロードしてください", outputSize / 2, outputSize / 2);
      return;
    }

    if (mode === "vertical") {
      const half = (contentSize - dividerWidth) / 2;
      if (img1) {
        drawImageContain(ctx, img1, outerPadding, outerPadding, half, contentSize, 12);
      }
      if (img2) {
        drawImageContain(ctx, img2, outerPadding + half + dividerWidth, outerPadding, half, contentSize, 12);
      }
      ctx.fillStyle = background;
      ctx.fillRect(outerPadding + half, outerPadding, dividerWidth, contentSize);
      return;
    }

    if (mode === "horizontal") {
      const half = (contentSize - dividerWidth) / 2;
      if (img1) {
        drawImageContain(ctx, img1, outerPadding, outerPadding, contentSize, half, 12);
      }
      if (img2) {
        drawImageContain(ctx, img2, outerPadding, outerPadding + half + dividerWidth, contentSize, half, 12);
      }
      ctx.fillStyle = background;
      ctx.fillRect(outerPadding, outerPadding + half, contentSize, dividerWidth);
      return;
    }

    // diagonal mode
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(outerPadding, outerPadding);
    ctx.lineTo(outputSize - outerPadding, outerPadding);
    ctx.lineTo(outerPadding, outputSize - outerPadding);
    ctx.closePath();
    ctx.clip();
    if (img1) {
      drawImageContain(ctx, img1, outerPadding, outerPadding, contentSize, contentSize, 20);
    }
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(outputSize - outerPadding, outerPadding);
    ctx.lineTo(outputSize - outerPadding, outputSize - outerPadding);
    ctx.lineTo(outerPadding, outputSize - outerPadding);
    ctx.closePath();
    ctx.clip();
    if (img2) {
      drawImageContain(ctx, img2, outerPadding, outerPadding, contentSize, contentSize, 20);
    }
    ctx.restore();

    ctx.strokeStyle = background;
    ctx.lineWidth = dividerWidth;
    ctx.beginPath();
    ctx.moveTo(outputSize - outerPadding, outerPadding);
    ctx.lineTo(outerPadding, outputSize - outerPadding);
    ctx.stroke();
  }, [background, divider, file1Url, file2Url, loadImage, mode, padding, size]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const onFileChange = (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setter((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "combined-logo.png";
    link.click();
  };

  const resetAll = () => {
    setPadding([24]);
    setSize([512]);
    setDivider([8]);
    setBackground("#ffffff");
    setMode("diagonal");
  };

  const hasImages = useMemo(() => Boolean(file1Url || file2Url), [file1Url, file2Url]);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>画像1</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-700 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              画像をアップロード
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, setFile1Url)} />
            </label>
          </div>

          <div className="space-y-3">
            <Label>画像2</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-700 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              画像をアップロード
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, setFile2Url)} />
            </label>
          </div>

          <div className="space-y-2">
            <Label>分割方法</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["diagonal", "斜め"],
                ["vertical", "左右"],
                ["horizontal", "上下"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant={mode === value ? "default" : "outline"}
                  onClick={() => setMode(value)}
                  className="rounded-xl"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>余白: {padding[0]}px</Label>
            <Slider value={padding} min={0} max={80} step={2} onValueChange={setPadding} />
          </div>

          <div className="space-y-2">
            <Label>仕上がりサイズ: {size[0]}px</Label>
            <Slider value={size} min={256} max={1024} step={64} onValueChange={setSize} />
          </div>

          <div className="space-y-2">
            <Label>区切り線: {divider[0]}px</Label>
            <Slider value={divider} min={0} max={32} step={1} onValueChange={setDivider} />
          </div>

          <div className="space-y-2">
            <Label>背景色</Label>
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white p-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadPng} disabled={!hasImages} className="flex-1 rounded-xl">
              <Download className="mr-2 h-4 w-4" />
              PNG保存
            </Button>
            <Button variant="outline" onClick={resetAll} className="rounded-xl">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">プレビュー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center rounded-2xl bg-slate-100 p-6">
            <canvas
              ref={canvasRef}
              className="h-auto max-h-[560px] w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white shadow-sm"
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            LINEやSlack向けのグループ画像を想定しています。正方形ロゴ同士ならそのまま使えます。余白が大きいロゴは、画像側を少しトリミングしてから入れると見栄えが安定します。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LogoGridCombiner() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Logo Grid Combiner</h1>
          <p className="mt-2 text-sm text-slate-600">
            2つの正方形画像を、〼のような2分割アイコンとして合成する簡易ツールです。
          </p>
        </div>
        <LogoCombinerApp />
      </div>
    </div>
  );
}
