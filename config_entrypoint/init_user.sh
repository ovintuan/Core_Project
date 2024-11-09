#!/bin/bash

# Function to process each user
process_user() {
    local username=$1
    local uid=$2

    # Check if the user exists and fetch current UID
    if id "$username" &>/dev/null; then
        # User exists, update UID if needed
        current_uid=$(id -u "$username") && \
        if [ "$current_uid" != "$uid" ]; then
            echo "Updating UID for existing user $username to $uid"
            # Update the user UID
            usermod -u "$uid" "$username" && \
            # Update the file ownership for the user
            find / -user "$current_uid" -exec chown -h "$username" {} \;
        fi
    else
        # User does not exist, create the user with specified UID
        echo "Creating new user $username with UID $uid" && \
        groupadd -g "$uid" "$username" && \
        useradd -m -u "$uid" -g "$username" "$username"
    fi
}

# # Function to set permissions for users
# grant_permissions() {
#     local path=$1
#     local permissions_list=$2

#     # Ensure the path exists
#     if [ ! -d "$path" ]; then
#         echo "Path $path does not exist."
#         exit 1
#     fi

#     # Process the permissions list
#     IFS=',' read -r -a user_permissions <<< "$permissions_list"
#     for user_perm in "${user_permissions[@]}"; do
#         IFS=':' read -r username permissions <<< "$user_perm"
#         # Check if the user exists
#         if id "$username" &>/dev/null; then
#             echo "Setting permissions for user $username on $path"
#             # Apply the permissions
#             chown "$username:$username" "$path"
#             chmod "$permissions" "$path"
#         else
#             echo "User $username does not exist. Skipping."
#         fi
#     done
# }

# Read users, UIDs, and permissions from the environment variable
if [ -n "$INIT_USER_LIST" ]; then
    # Assume INIT_USER_LIST is a comma-separated list of username:uid:permissions
    IFS=',' read -r -a user_list <<< "$INIT_USER_LIST"
    for user_entry in "${user_list[@]}"; do
        IFS=':' read -r username uid permissions <<< "$user_entry"
        process_user "$username" "$uid"
        # grant_permissions "$INIT_PERMISSION_PATH" "$username:$permissions"
    done
else
    echo "No user list provided. Please set the INIT_USER_LIST environment variable."
    exit 1
fi

# Continue with the default command
exec "$@"
