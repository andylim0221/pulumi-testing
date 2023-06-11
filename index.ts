import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { Archive, AssetArchive } from "@pulumi/pulumi/asset";

const config = new pulumi.Config()

const current = aws.getCallerIdentity({})
const accountId = current.then(current=> current.accountId);
const functionName = config.get('lambdaFunctionName') || "lambda_function"
const eventRuleName = config.get('eventRuleName') || "example_event"


const lambdaFunctionIamRole = new aws.iam.Role("lambda-function-execution-role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17", 
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com"
            }
        }]
    }),
    managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    ]
})

const lambdaFunction = new aws.lambda.Function(functionName, {
    role: lambdaFunctionIamRole.arn,
    handler: "index.handler",
    runtime: "nodejs18.x",
    code: new AssetArchive({
        ".": new pulumi.asset.FileArchive("./app")
    })
})

const eventRule = new aws.cloudwatch.EventRule(eventRuleName, {
    description: "This is a testing event",
    scheduleExpression: "rate(5 minutes)"
})

const eventTarget = new aws.cloudwatch.EventTarget("eventTargetBinding", {
    rule: eventRule.name,
    arn: lambdaFunction.arn
})

export const eventRuleArn = eventRule.arn
export const lambdaFunctionArn = lambdaFunction.arn
