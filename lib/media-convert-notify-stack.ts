import { Construct } from 'constructs';
import { Function, Runtime, Code, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';

interface MediaConvertNotifyProps {
  status: ['COMPLETE'] | ['NEW_WARNING', 'ERROR'];
  queueArn: string;
  customerMediaConvertEndpoint: string;
  getJobPolicy: PolicyStatement;
  inputBucket: Bucket;
}

export class MediaConvertNotifyStack extends Construct {
  constructor(scope: Construct, id: string, props: MediaConvertNotifyProps) {
    super(scope, id);

    // 動画変換に成功した場合のフローを定義
    const eventRule = new Rule(this, 'MediaConvertNotifyRule', {
      ruleName: props.status[0] === 'COMPLETE' ? 'watch-complete-event-rule' : 'watch-error-event-rule',
      eventPattern: {
        source: ['aws.mediaconvert'],
        detailType: ['MediaConvert Job State Change'],
        detail: {
          status: props.status,
          queue: [props.queueArn],
        },
      },
    });
    const layer = new LayerVersion(this, 'MediaConvertNotifyLambdaLayer', {
      layerVersionName: 'nodejs20-jimp',
      compatibleRuntimes: [Runtime.NODEJS_20_X],
      code: Code.fromAsset('lambda_layer/jimp'),
    });
    const lambda = new Function(this, 'MediaConvertNotifyLambda', {
      functionName: props.status[0] === 'COMPLETE' ? 'notify-success-job' : 'notify-error-job',
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: props.status[0] === 'COMPLETE' ? Code.fromAsset('lambda/notify_success_job') : Code.fromAsset('lambda/notify_error_job'),
      layers: [layer],
      environment: {
        MEDIA_CONVERT_ENDPOINT: props.customerMediaConvertEndpoint,
      },
    });
    lambda.addToRolePolicy(props.getJobPolicy);
    props.inputBucket.grantReadWrite(lambda);
    eventRule.addTarget(new LambdaFunction(lambda));
  }
}