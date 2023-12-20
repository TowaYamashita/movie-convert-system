import { Construct } from "constructs";
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Function, Runtime, Code, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

interface MediaConvertProcessProps {
  /**
   * MediaConvert のアカウント別エンドポイント
   * @example https://xxxxxxxxx.mediaconvert.us-east-1.amazonaws.com
   */
  customerMediaConvertEndpoint: string;
  /**
   * MediaConvert のキューのARN
   */
  queueArn: string;
  /**
   * 変換元動画のアップロード先のS3バケット
   */
  inputBucket: Bucket;
  /**
   * MediaConvert でジョブを実行する際に渡すIAM Role の ARN
   */
  queueIamRoleArn: string;
  /**
   * MediaConvert のジョブを作成する際に使う解像度別出力プリセット
   */
  outputPresetArns: Record<'360p' | '720p' | '1080p', string>;
  /**
   * 変換元動画のプレフィックス
   */
  inputPrefix: string;
  /**
   * 変換後動画のプレフィックス
   */
  outputPrefix: string;
  /**
   * MediaConvert のジョブを作成する処理を実行する Lambda に割当てる IAM Role
   */
  createJobPolicy: PolicyStatement;
  /**
   * ジョブ作成後に通知を出すSlackチャンネルのWebhook URL
   */
  slackWebhookUrl: string;
}

export class MediaConvertProcessStack extends Construct {
  constructor(scope: Construct, id: string, props: MediaConvertProcessProps) {
    super(scope, id);

    const layer = new LayerVersion(this, 'MediaConvertLambdaLayer', {
      layerVersionName: 'nodejs20-axios',
      compatibleRuntimes: [Runtime.NODEJS_20_X],
      code: Code.fromAsset('lambda_layer/axios'),
    });

    const mediaConvertLambda = new Function(this, 'MediaConvertLambda', {
      functionName: 'submit-job',
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset('lambda/submit_job'),
      layers: [layer],
      environment: {
        MEDIA_CONVERT_ENDPOINT: props.customerMediaConvertEndpoint,
        QUEUE_ARN: props.queueArn,
        MOVIE_CONVERT_BUCKET_ARN: props.inputBucket.s3UrlForObject(),
        IAM_ROLE_ARN: props.queueIamRoleArn,
        OUTPUT_PRESET_360P_ARN: props.outputPresetArns['360p'],
        OUTPUT_PRESET_720P_ARN: props.outputPresetArns['720p'],
        OUTPUT_PRESET_1080P_ARN: props.outputPresetArns['1080p'],
        INPUT_PREFIX: props.inputPrefix,
        OUTPUT_PREFIX: props.outputPrefix,
        SLACK_WEBHOOK_URL: props.slackWebhookUrl,
      },
    });
    mediaConvertLambda.addToRolePolicy(props.createJobPolicy);
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
      resources: [props.queueIamRoleArn],
    }));

    props.inputBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(mediaConvertLambda),
      { prefix: `${props.inputPrefix}/` }
    );
  }
}