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
  - 本番環境へデプロイする場合は、`cdk.json` の prd に適当な値を記入する必要がある

```shell
# 開発環境
npm run cdk deploy -- -c stage=dev

# 本番環境
npm run cdk deploy -- -c stage=prd
```

- 下記コマンドを実行して、アプリケーションスタックを削除する

```shell
# 開発環境
npm run cdk destroy -- -c stage=dev

# 本番環境
npm run cdk destroy -- -c stage=prd
```

> npm run cdk bootstrap 実行時に作成されたブートストラップスタックは AWS CloudFormation コンソールから手動で削除する