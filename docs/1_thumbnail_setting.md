# AWS Elemental MediaConvert でサムネイルを出力する際の設定メモ

## サイズについて

https://docs.aws.amazon.com/mediaconvert/latest/ug/video-scaling.html

サムネイル出力する際に使用するプリセット

```
{
  "VideoDescription": {
    "Width": 100,
    "Height": 100,
    "ScalingBehavior": <スケーリング動作名>,
    "Sharpness": 50,
    "CodecSettings": {
      "Codec": "FRAME_CAPTURE",
      "FrameCaptureSettings": {
        "Quality": 80,
        "MaxCaptures": 1
      }
    }
  },
  "ContainerSettings": {
    "Container": "RAW"
  }
}
```

### 入力動画が横長の場合

> 入力動画のサイズは、1280 × 720

|スケーリング動作名|出力されたサムネイルのサイズ||
|:--|:--|:--|
|DEFAULT|100 x 100|![](images/A_1_ScalingBehavior_DEFAULT.jpeg)|
|STRETCH_TO_OUTPUT|100 x 100|![](images/A_2_ScalingBehavior_STRETCH_TO_OUTPUT.jpeg)|
|FIT|100 x 56|![](images/A_3_ScalingBehavior_FIT.jpeg)|
|FIT_NO_UPSCALE|100 x 56|![](images/A_4_ScalingBehavior_FIT_NO_UPSCALE.jpeg)|
|FILL|100 x 100|![](images/A_5_ScalingBehavior_FILL.jpeg)|


### 入力動画が縦長の場合

> 入力動画のサイズは、886 × 1920

|スケーリング動作名|出力されたサムネイルのサイズ||
|:--|:--|:--|
|DEFAULT|100 x 100|![](images/B_1_ScalingBehavior_DEFAULT.jpeg)|
|STRETCH_TO_OUTPUT|100 x 100|![](images/B_2_ScalingBehavior_STRETCH_TO_OUTPUT.jpeg)|
|FIT|46 x 100|![](images/B_3_ScalingBehavior_FIT.jpeg)|
|FIT_NO_UPSCALE|46 x 100|![](images/B_4_ScalingBehavior_FIT_NO_UPSCALE.jpeg)|
|FILL|100 x 100|![](images/B_5_ScalingBehavior_FILL.jpeg)|

### FIT と FIT_NO_UPSCALE の違う点

入力幅および高さが出力幅および高さよりも小さい場合の挙動が異なる

- 例: 入力(200 x 200) -> 出力(400 x 300) の場合
  - FIT: 300 x 300 (= 入力のアスペクト比を保ったまま入力を拡大する)
  - FIT_NO_UPSCALE: 200 x 200 (= 入力を拡大および縮小せずに出力する)
