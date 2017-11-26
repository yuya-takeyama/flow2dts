import { parse, TProgram, TPattern, TFunctionDeclaration, TTypeAnnotation } from 'flow-parser';
import { neverReachHere } from './utils';

const typeAnnotationTypeToType = (typeAnnotationType: string): string => {
  switch (typeAnnotationType) {
  case 'StringTypeAnnotation':
    return 'string';

  case 'NumberTypeAnnotation':
    return 'number';

  case 'BooleanTypeAnnotation':
    return 'boolean';

  default:
    return neverReachHere(`Unnown annotation type: ${typeAnnotationType}`);
  }
};

export function transform(code: string): string {
  return transformProgram(parse(code));
}

export function transformProgram(ast: TProgram): string {
  return ast.body.map((statement) => {
    switch (statement.type) {
    case 'ExportDefaultDeclaration':
      if (statement.declaration.type === 'FunctionDeclaration') {
        return `export default ${transformFunctionDeclaration(statement.declaration)}`;
      } else {
        return neverReachHere(`Unhandled expression: ${statement.declaration.type}`);
      }

    case 'ExportNamedDeclaration':
      if (statement.declaration.type === 'FunctionDeclaration') {
        return `export ${transformFunctionDeclaration(statement.declaration)}`;
      } else {
        return neverReachHere(`Unhandled expression: ${statement.declaration.type}`);
      }

    default:
      return neverReachHere(`Unhandled expression: ${statement.type}`);
    }
  }).join('\n') + '\n';
};

export function transformFunctionDeclaration(functionDeclaration: TFunctionDeclaration) {
  return `function ${functionDeclaration.id.name}(${transformParameters(functionDeclaration.params)})${transformReturnType(functionDeclaration.returnType)};`;
}

export function transformReturnType(typeAnnotation: TTypeAnnotation | null): string {
  if (typeAnnotation && typeAnnotation.typeAnnotation) {
    switch (typeAnnotation.typeAnnotation.type) {
    case 'GenericTypeAnnotation':
      return `: ${typeAnnotation.typeAnnotation.id.name}`;

    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'NumberTypeAnnotation':
      return `: ${typeAnnotationTypeToType(typeAnnotation.typeAnnotation.type)}`;

    default:
      return neverReachHere(`Unhandled type annotation type: ${typeAnnotation.typeAnnotation.type}`);
    }
  } else {
    return '';
  }
}

export function transformParameters(params: TPattern[]): string {
  return params.map((param: TPattern): string => {
    switch (param.type) {
    case 'Identifier':
      if (param.typeAnnotation && param.typeAnnotation.typeAnnotation) {
        return `${param.name}: ${typeAnnotationTypeToType(param.typeAnnotation.typeAnnotation.type)}`;
      } else {
        return param.name;
      }

    case 'RestElement':
      switch (param.argument.type) {
      case 'MemberExpression':
      case 'RestElement':
        return neverReachHere('Never be TMemberExpression');

      default:
        if (param.argument.type === 'Identifier') {
          if (param.argument.typeAnnotation && param.argument.typeAnnotation.typeAnnotation) {
            return `...${param.argument.name}: ${typeAnnotationTypeToType(param.argument.typeAnnotation.typeAnnotation.type)}`;
          } else {
            return `...${param.argument.name}`;
          }
        }

        return neverReachHere(`param.argument.type: ${param.argument.type}`);
      }

    default:
      return neverReachHere(`Unknown parameter type: ${param.type}`);
    }
  }).join(', ');
}
