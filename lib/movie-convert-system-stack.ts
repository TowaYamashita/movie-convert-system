import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { MediaConvetStack } from './media-convert-stack';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class MovieConvertSystemStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 変換元動画データアップロード先
    const inputBucket = new Bucket(this, 'InputBucket', {
      bucketName: 'input.example.com',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // 変換後動画データアップロード先
    const outputBucket = new Bucket(this, 'OutPutBucket', {
      bucketName: 'output.example.com',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // AWS Elemetal MediaConvert
    const queue = new MediaConvetStack(this, 'MediaConvert', {
      region: this.region,
      accountId: this.account,
      inputBucket: inputBucket.bucketName,
      outputBucket: outputBucket.bucketName,
    });

    // 動画変換作成ジョブを発行する Lambda関数
    const mediaConvertLambda = new Function(this, 'MediaConvertLambda', {
      functionName: 'submit-job',
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset('lambda/submit_job'),
      environment: {
        MEDIA_CONVERT_ENDPOINT: 'https://vasjpylpa.mediaconvert.us-east-1.amazonaws.com',
        QUEUE_ARN: queue.arn,
        OUTPUT_BUCKET_ARN: outputBucket.s3UrlForObject(),
        IAM_ROLE_ARN: queue.iamRoleArn,
        OUTPUT_PRESET_ARNS: queue.outputPresetArns.reduce((prev, current) => `${prev},${current}`),
      },
    });
    mediaConvertLambda.addToRolePolicy(queue.createJobPolicy);
    mediaConvertLambda.addToRolePolicy(new PolicyStatement({
      actions: [
        's3:*',
      ],
      resources: ['*'],
    }));
    mediaConvertLambda.addToRolePolicy(new PolicyStatement({
      actions: [
        'iam:PassRole',
      ],
      resources: [queue.iamRoleArn],
    }));

    inputBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(mediaConvertLambda)
    );
  }
}
