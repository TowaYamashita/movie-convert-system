import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MediaConvetStack } from './media-convert-stack';
import { InputBucketStack } from './input-bucket-stack';
import { MediaConvertProcessStack } from './media-convert-process-stack';
import { MediaConvertNotifyStack } from './media-convert-notify-stack';

interface StageContext {
  inputBucketName: string;
  outputBucketName: string;
  customerMediaConvertEndpoint: string;
  inputPrefix: string;
  outputPrefix: string;
  slackWebhookUrl: string;
}

export class MovieConvertSystemStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stage = this.node.tryGetContext('stage');
    const context: StageContext = this.node.tryGetContext(stage);

    // 変換元動画データアップロード先
    const inputBucket = new InputBucketStack (this, 'InputBucket', {
      bucketName: context.inputBucketName,
    });
    Tags.of(inputBucket).add('Service', `movie-convert-system-${stage}`);
    Tags.of(inputBucket).add('Ref', 'https://github.com/TowaYamashita/movie-convert-system');

    // AWS Elemetal MediaConvert
    const queue = new MediaConvetStack(this, 'MediaConvert', {
      region: this.region,
      accountId: this.account,
      inputBucket: inputBucket.bucket.bucketName,
      inputPrefix: context.inputPrefix,
      outputPrefix: context.outputPrefix,
    });
    Tags.of(queue).add('Service', `movie-convert-system-${stage}`);
    Tags.of(queue).add('Ref', 'https://github.com/TowaYamashita/movie-convert-system');

    // 動画変換作成ジョブの発行&実行
    const process = new MediaConvertProcessStack(this, 'MediaConvertProcess', {
      customerMediaConvertEndpoint: context.customerMediaConvertEndpoint,
      queueArn: queue.arn,
      inputBucket: inputBucket.bucket,
      queueIamRoleArn: queue.iamRoleArn,
      outputPresetArns: queue.outputPresetArns,
      inputPrefix: context.inputPrefix,
      outputPrefix: context.outputPrefix,
      createJobPolicy: queue.createJobPolicy,
      slackWebhookUrl: context.slackWebhookUrl,
    });
    Tags.of(process).add('Service', `movie-convert-system-${stage}`);
    Tags.of(process).add('Ref', 'https://github.com/TowaYamashita/movie-convert-system');

    // 動画変換に成功した場合のフローを定義
    const success = new MediaConvertNotifyStack(this, 'MediaConvertSuccessNotifiy', {
      status: ['COMPLETE'],
      queueArn: queue.arn,
      customerMediaConvertEndpoint: context.customerMediaConvertEndpoint,
      getJobPolicy: queue.getJobPolicy,
      inputBucket: inputBucket.bucket,
    });
    Tags.of(success).add('Service', `movie-convert-system-${stage}`);
    Tags.of(success).add('Ref', 'https://github.com/TowaYamashita/movie-convert-system');

    // 動画変換に失敗した場合のフローを定義
    const error = new MediaConvertNotifyStack(this, 'MediaConvertErrorNotifiy', {
      status: ['NEW_WARNING', 'ERROR'],
      queueArn: queue.arn,
      customerMediaConvertEndpoint: context.customerMediaConvertEndpoint,
      getJobPolicy: queue.getJobPolicy,
      inputBucket: inputBucket.bucket,
    });
    Tags.of(error).add('Service', `movie-convert-system-${stage}`);
    Tags.of(error).add('Ref', 'https://github.com/TowaYamashita/movie-convert-system');
  }
}
