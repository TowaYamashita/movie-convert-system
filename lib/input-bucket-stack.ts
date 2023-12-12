import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface InputBucketProps {
  /**
   * 変換元動画のアップロード先のS3バケット名
   * @example input.example.com
   */
  bucketName: string;
}

export class InputBucketStack extends Construct{
  /**
   * 作成したS3バケット
   */
  public readonly bucket : Bucket;

  constructor(scope: Construct, id: string, props: InputBucketProps){
    super(scope, id);

    const inputBucket = new Bucket(this, 'InputBucket', {
      bucketName: props.bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    inputBucket.addLifecycleRule({
      id: 'DeleteObjectsWithTagDelay',
      tagFilters: {
        delay: 'true'
      },
      expiration: Duration.days(1),
      noncurrentVersionExpiration: Duration.days(1),
    });
  }
}