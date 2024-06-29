#!/bin/sh

ln -s /usr/local/bin_python/python /usr/bin/python
ln -s /usr/local/bin_python/python /usr/bin/python3

# Execute the original command passed to the container
exec "$@"
