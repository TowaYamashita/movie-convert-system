export async function handler(event){
  await updateInputS3ObjectTag(event);

  console.log(`${event.detail.status}: ${event}`);
}

// 入力元の動画がアップロードされたS3オブジェクトに対して、ライフサイクルで使用するタグを付与する
async function updateInputS3ObjectTag(event) {
  const s3 = await fetchInputS3BucketAndObejctKey(event);

  // 入力元の動画がアップロードされたS3オブジェクトにタグを付与する
  const s3Client = new S3Client();
  const currentTagsData = await s3Client.send(
    new GetObjectTaggingCommand({
      Bucket: s3.bucket,
      Key: s3.objectKey,
    })
  );
  const currentTags = currentTagsData.TagSet;
  const existingTag = currentTags.find(tag => tag.key == 'delay');
  if(existingTag) {
    existingTag.Value = 'true';
  } else {
    currentTags.push({Key: 'delay', Value: 'true'});
  }
  await s3Client.send(
    new PutObjectTaggingCommand({
      Bucket: s3.bucket,
      Key: s3.objectKey,
      Tagging: {
        TagSet: currentTags
      }
    })
  );
}

async function fetchInputS3BucketAndObejctKey(event) {
  // jobId から Job を取得する
  const mediaConvertClient = new MediaConvertClient({
    apiVersion: '2017-08-29',
    endpoint: process.env.MEDIA_CONVERT_ENDPOINT,
  });
  const response = await mediaConvertClient.send(
    new GetJobCommand({
      Id: event.detail.jobId,
    })
  );
  
  // 入力元の動画がアップロードされたS3オブジェクトのS3URL
  // 例: s3://input.example.com/upload/movie/sample.mov
  // TODO: 単一の入力ファイルから複数個の出力ファイルが生成される想定であるため、複数個の入力ファイルがあることは考慮しない
  const inputFilePath = response.Job.Settings.Inputs[0].FileInput;

  return parseS3Url(inputFilePath);
}

// S3URLからバケット名とキーを取得
// 例: s3://input.example.com/upload/movie/sample.mov -> {input.example.com, upload/movie/sample.mov}
function parseS3Url(s3Url) {
  const strippedUrl = s3Url.replace('s3://', '');

  const parts = strippedUrl.split('/');

  const bucket = parts.shift();
  const objectKey = parts.join('/');

  return { bucket, objectKey };
}