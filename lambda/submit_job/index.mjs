import { MediaConvert } from '@aws-sdk/client-mediaconvert';

export async function handler(event) {
  const mediaconvert = new MediaConvert({
    apiVersion: '2017-08-29',
    endpoint: process.env.MEDIA_CONVERT_ENDPOINT,
  });
  
  // S3イベントからファイル情報を取得
  const s3Info = event.Records[0].s3;
  const inputBucket = s3Info.bucket.name;
  const inputFileKey = decodeURIComponent(s3Info.object.key.replace(/\+/g, " "));

  // MediaConvert ジョブで使用する出力テンプレートのARNの配列
  // 環境変数では文字列でしか渡せないためカンマ区切りにしているため扱いやすいようにする
  const presetArnList = process.env.OUTPUT_PRESET_ARNS.split(',');

  // MediaConvert ジョブの設定
  const params = {
    "Queue": `${process.env.QUEUE_ARN}`,
    "Role": `${process.env.IAM_ROLE_ARN}`,
    "Settings": {
      "OutputGroups": [
        {
          "Name": "File Group",
          "OutputGroupSettings": {
            "Type": "FILE_GROUP_SETTINGS",
            "FileGroupSettings": {
              "Destination": `${process.env.OUTPUT_BUCKET_ARN}/`
            }
          },
          "Outputs": [
            {
              "Preset": presetArnList[0],
              "NameModifier": "_1"
            }
          ]
        }
      ],
      "AdAvailOffset": 0,
      "Inputs": [
        {
          "AudioSelectors": {
            "Audio Selector 1": {
              "Offset": 0,
              "DefaultSelection": "NOT_DEFAULT",
              "ProgramSelection": 1,
              "SelectorType": "TRACK",
              "Tracks": [
                1
              ]
            }
          },
          "VideoSelector": {
            "ColorSpace": "FOLLOW"
          },
          "FilterEnable": "AUTO",
          "PsiControl": "USE_PSI",
          "FilterStrength": 0,
          "DeblockFilter": "DISABLED",
          "DenoiseFilter": "DISABLED",
          "TimecodeSource": "EMBEDDED",
          "FileInput": `s3://${inputBucket}/${inputFileKey}`
        }
      ],
      "TimecodeConfig": {
        "Source": "EMBEDDED"
      }
    }
  };
  
  try {
      // MediaConvert ジョブの作成
      const data = await mediaconvert.createJob(params);
      console.log('MediaConvert job created:', data);
      return data;
  } catch (err) {
      console.error('Error creating MediaConvert job:', err);
      throw new Error('Error creating MediaConvert job');
  }
}
