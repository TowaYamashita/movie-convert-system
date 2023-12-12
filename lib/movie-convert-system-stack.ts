import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MediaConvetStack } from './media-convert-stack';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { InputBucketStack } from './input-bucket-stack';
import { MediaConvertProcessStack } from './media-convert-process-stack';

interface StageContext {
  inputBucketName: string;
  outputBucketName: string;
  customerMediaConvertEndpoint: string;
  inputPrefix: string;
  outputPrefix: string;
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

    // AWS Elemetal MediaConvert
    const queue = new MediaConvetStack(this, 'MediaConvert', {
      region: this.region,
      accountId: this.account,
      inputBucket: inputBucket.bucket.bucketName,
      inputPrefix: context.inputPrefix,
      outputPrefix: context.outputPrefix,
    });

    // 動画変換作成ジョブの発行&実行
    new MediaConvertProcessStack(this, 'MediaConvertProcess', {
      customerMediaConvertEndpoint: context.customerMediaConvertEndpoint,
      queueArn: queue.arn,
      inputBucket: inputBucket.bucket,
      queueIamRoleArn: queue.iamRoleArn,
      outputPresetArns: queue.outputPresetArns,
      inputPrefix: context.inputPrefix,
      outputPrefix: context.outputPrefix,
      createJobPolicy: queue.createJobPolicy,
    });

    // 動画変換に成功した場合のフローを定義
    const eventSuccessRule = new Rule(this, 'MediaConvertSuccessRule', {
      eventPattern: {
        source: ['aws.mediaconvert'],
        detailType: ['MediaConvert Job State Change'],
        detail: {
          status: ['COMPLETE'],
          queue: [queue.arn],
        },
      },
    });
    const notifySuccessLambda = new Function(this, 'NotifySuccessLambda', {
      functionName: 'notify-success-job',
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset('lambda/notify_success_job'),
      environment: {
        MEDIA_CONVERT_ENDPOINT: context.customerMediaConvertEndpoint,
      },
    });
    notifySuccessLambda.addToRolePolicy(queue.getJobPolicy);
    inputBucket.bucket.grantReadWrite(notifySuccessLambda);
    eventSuccessRule.addTarget(new LambdaFunction(notifySuccessLambda));

    // 動画変換に失敗した場合のフローを定義
    const eventErrorRule = new Rule(this, 'MediaConvertErrorRule', {
      eventPattern: {
        source: ['aws.mediaconvert'],
        detailType: ['MediaConvert Job State Change'],
        detail: {
          status: ['NEW_WARNING', 'ERROR'],
          queue: [queue.arn],
        },
      },
    });
    const notifyErrorLambda = new Function(this, 'NotifyErrorLambda', {
      functionName: 'notify-error-job',
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset('lambda/notify_error_job'),
      environment: {
        MEDIA_CONVERT_ENDPOINT: context.customerMediaConvertEndpoint,
      },
    });
    notifyErrorLambda.addToRolePolicy(queue.getJobPolicy);
    inputBucket.bucket.grantReadWrite(notifyErrorLambda);
    eventErrorRule.addTarget(new LambdaFunction(notifyErrorLambda));
  }
}
