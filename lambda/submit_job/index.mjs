import { MediaConvert } from '@aws-sdk/client-mediaconvert';

export async function handler(event) {
  const mediaconvert = new MediaConvert({
    apiVersion: '2017-08-29',
    endpoint: process.env.MEDIA_CONVERT_ENDPOINT,
  });

  // S3イベントからファイル情報を取得
  const s3Info = event.Records[0].s3;
  const inputBucket = s3Info.bucket.name;
  const inputFileKey = s3Info.object.key;

  // 出力ファイル先のパスを生成
  const inputFilePrefix = inputFileKey.split('/').slice(0, -1).join('/');
  const outputFilePrefix = inputFilePrefix.replace(process.env.INPUT_PREFIX, process.env.OUTPUT_PREFIX);
  const outputFilePath = `${process.env.MOVIE_CONVERT_BUCKET_ARN}/${outputFilePrefix}`;

  // MediaConvert ジョブで使用する出力テンプレートのARNの配列
  const presetArnList = {
    '360p': process.env.OUTPUT_PRESET_360P_ARN,
    '720p': process.env.OUTPUT_PRESET_720P_ARN,
    '1080p': process.env.OUTPUT_PRESET_1080P_ARN,
  };

  // MediaConvert ジョブの設定
  const params = {
    "Queue": `${process.env.QUEUE_ARN}`,
    "Role": `${process.env.IAM_ROLE_ARN}`,
    "Settings": {
      "TimecodeConfig": {
        "Source": "ZEROBASED"
      },
      "OutputGroups": [
        {
          "CustomName": "normal",
          "Name": "Apple HLS",
          "Outputs": [
            {
              "Preset": presetArnList['360p'],
              "NameModifier": "_360p"
            },
            {
              "Preset": presetArnList["720p"],
              "NameModifier": "_720p"
            }
          ],
          "OutputGroupSettings": {
            "Type": "HLS_GROUP_SETTINGS",
            "HlsGroupSettings": {
              "SegmentLength": 10,
              "MinSegmentLength": 0,
              "Destination": `${outputFilePath}/normal/`,
            }
          }
        },
        {
          "CustomName": "premium",
          "Name": "Apple HLS",
          "Outputs": [
            {
              "Preset": presetArnList["360p"],
              "NameModifier": "_360p"
            },
            {
              "Preset": presetArnList["720p"],
              "NameModifier": "_720p"
            },
            {
              "Preset": presetArnList["1080p"],
              "NameModifier": "_1080p"
            }
          ],
          "OutputGroupSettings": {
            "Type": "HLS_GROUP_SETTINGS",
            "HlsGroupSettings": {
              "SegmentLength": 10,
              "MinSegmentLength": 0,
              "Destination": `${outputFilePath}/premium/`,
            }
          }
        }
      ],
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
    },
    "AccelerationSettings": {
      "Mode": "DISABLED"
    },
    "StatusUpdateInterval": "SECONDS_60",
    "Priority": 0,
    "HopDestinations": []
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
