import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { CfnPreset, CfnQueue } from "aws-cdk-lib/aws-mediaconvert";
import { Construct } from "constructs";
import { readFileSync } from "fs";

interface MediaConvetProps {
  region: string;
  accountId: string;
  inputBucket: string;
  inputPrefix: string;
  outputPrefix: string;
}

export class MediaConvetStack extends Construct {
  public readonly arn: string;
  public readonly queueName: string;
  public readonly queuId: string;
  public readonly createJobPolicy: PolicyStatement;
  public readonly getJobPolicy: PolicyStatement;
  public readonly iamRoleArn: string;
  public readonly outputPresetArns: Record<string, string>;

  constructor(scope: Construct, id: string, props: MediaConvetProps){
    super(scope, id);

    const queue = new CfnQueue(this, 'MediaConvertQueue', {
      name: 'sandbox-movie-convert',
      pricingPlan: 'ON_DEMAND', 
      status: 'ACTIVE',
    });

    this.arn = queue.attrArn;
    this.queueName = queue.attrName;
    this.queuId = queue.attrId;

    this.createJobPolicy = new PolicyStatement({
      resources: [
        `arn:aws:mediaconvert:${props.region}:${props.accountId}:queues/${queue.name}`,
        `arn:aws:mediaconvert:${props.region}:${props.accountId}:presets/*`,
      ],
      actions: [
        'mediaconvert:CreateJob',
      ],
    });
    this.getJobPolicy = new PolicyStatement({
      resources: [
        '*',
      ],
      actions: [
        'mediaconvert:GetJob',
      ],
    });

    const role = new Role(this, 'MediaConvertRole', {
      assumedBy: new ServicePrincipal('mediaconvert.amazonaws.com')
    });
    role.addToPolicy(
      new PolicyStatement({
        resources: [
          `arn:aws:s3:::${props.inputBucket}/${props.inputPrefix}/*`
        ],
        actions: [
          "s3:List*",
          "s3:Get*",
        ],
      })
    );
    role.addToPolicy(
      new PolicyStatement({
        resources: [
          `arn:aws:s3:::${props.inputBucket}/${props.outputPrefix}/*`
        ],
        actions: [
          "s3:Put*",
        ],
      })
    );
    this.iamRoleArn = role.roleArn;

    const outputPresetFiles = [
      {
        'resolution': '360p',
        'presetName': 'Custom-640x360p',
      },
      {
        'resolution': '720p',
        'presetName': 'Custom-1280x720p',
      },
      {
        'resolution': '1080p',
        'presetName': 'Custom-1920x1080p',
      },
    ];
    let presetArns: Record<string, string> = {};
    for (let index = 0; index < outputPresetFiles.length; index++) {
      const outputPresetFile = outputPresetFiles[index];
      const fileName = `assets/media_convert/${outputPresetFile.presetName}.json`;
      let preset = new CfnPreset(this, `MediaConvertOutputPreset${index}`, {
        name: outputPresetFile.presetName,
        settingsJson: JSON.parse(readFileSync(fileName, 'utf-8'))
      });
      presetArns[outputPresetFile.resolution] = preset.attrArn;
    }
    this.outputPresetArns = presetArns;
  }
}