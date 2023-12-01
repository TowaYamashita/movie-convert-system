import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { MediaConvetStack } from './media-convert-stack';

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
    const queue = new MediaConvetStack(this, 'MediaConvert', {});
  }
}
