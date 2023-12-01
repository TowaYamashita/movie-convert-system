import { CfnJobTemplate, CfnPreset, CfnQueue } from "aws-cdk-lib/aws-mediaconvert";
import { Construct } from "constructs";

interface MediaConvetProps {}

export class MediaConvetStack extends Construct{
  public readonly arn: string;
  public readonly queueName: string;
  public readonly queuId: string;

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
  }
}