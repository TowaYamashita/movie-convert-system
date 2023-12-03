# movie-convert-system

AWS Elemental MediaConvert を使った動画変換システム

# Overview

TODO

# Environment

```shell
❯ aws --version     
aws-cli/2.13.32 Python/3.11.6 Darwin/23.1.0 exe/x86_64 prompt/off

❯ npm --version        
10.1.0
```

# Usage

- AdministratorAccess のIAMポリシーをアタッチされたIAMユーザを作成し、そのユーザのアクセスキーIDとシークレットアクセスキーを取得する
- `aws configure` で 取得したアクセスキーIDとシークレットアクセスキーを設定する
- 下記コマンドを実行して、AWS CDK を用いてアプリケーションスタックをデプロイする準備を行う

```shell
npm install
npm run cdk bootstrap
```

- 下記コマンドを実行して、アプリケーションスタックをデプロイする
> ※出力先バケットは AWS CDK では作成しないので、既存のS3バケット名を指定する

```shell
npm run cdk deploy -- -c outputBacketName=<出力先バケット名>
# npm run cdk deploy -- -c outputBacketName=output.example.com
```

- 下記コマンドを実行して、アプリケーションスタックを削除する

```shell
npm run cdk destroy
```

> npm run cdk bootstrap 実行時に作成されたブートストラップスタックは AWS CloudFormation コンソールから手動で削除する