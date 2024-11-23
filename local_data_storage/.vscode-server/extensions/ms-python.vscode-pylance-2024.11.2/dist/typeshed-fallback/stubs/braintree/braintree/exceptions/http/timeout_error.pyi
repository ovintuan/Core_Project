from braintree.exceptions.unexpected_error import UnexpectedError

class TimeoutError(UnexpectedError): ...
class ConnectTimeoutError(TimeoutError): ...
class ReadTimeoutError(TimeoutError): ...