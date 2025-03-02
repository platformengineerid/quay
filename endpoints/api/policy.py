import logging

from flask import request

import features
from auth import scopes
from auth.auth_context import get_authenticated_user
from auth.permissions import AdministerOrganizationPermission
from data import model
from endpoints.api import (
    ApiResource,
    allow_if_superuser,
    log_action,
    nickname,
    path_param,
    request_error,
    require_scope,
    require_user_admin,
    resource,
    show_if,
    validate_json_request,
)
from endpoints.exception import InvalidRequest, NotFound, Unauthorized

logger = logging.getLogger(__name__)


@resource("/v1/organization/<orgname>/autoprunepolicy/")
@path_param("orgname", "The name of the organization")
@show_if(features.AUTO_PRUNE)
class OrgAutoPrunePolicies(ApiResource):
    """
    Resource for listing and creating organization auto-prune policies
    """

    schemas = {
        "AutoPrunePolicyConfig": {
            "type": "object",
            "description": "The policy configuration that is to be applied to the organization",
            "required": ["method", "value"],
            "properties": {
                "method": {
                    "type": "string",
                    "description": "The method to use for pruning tags (number_of_tags, creation_date)",
                },
                "value": {
                    "type": ["integer", "string"],
                    "description": "The value to use for the pruning method (number of tags e.g. 10, time delta e.g. 7d (7 days))",
                },
            },
        },
    }

    @require_scope(scopes.ORG_ADMIN)
    @nickname("listOrganizationAutoPrunePolicies")
    def get(self, orgname):
        """
        Lists the auto-prune policies for the organization
        """
        permission = AdministerOrganizationPermission(orgname)
        if not permission.can() and not allow_if_superuser():
            raise Unauthorized()

        policies = model.autoprune.get_namespace_autoprune_policies_by_orgname(orgname)

        return {"policies": [policy.get_view() for policy in policies]}

    @require_scope(scopes.ORG_ADMIN)
    @validate_json_request("AutoPrunePolicyConfig")
    @nickname("createOrganizationAutoPrunePolicy")
    def post(self, orgname):
        """
        Creates an auto-prune policy for the organization
        """
        permission = AdministerOrganizationPermission(orgname)
        if not permission.can() and not allow_if_superuser():
            raise Unauthorized()

        app_data = request.get_json()
        method = app_data.get("method", None)
        value = app_data.get("value", None)

        if method is None or value is None:
            request_error(message="Missing the following parameters: method, value")

        policy_config = {
            "method": method,
            "value": value,
        }

        try:
            policy = model.autoprune.create_namespace_autoprune_policy(
                orgname, policy_config, create_task=True
            )
        except model.InvalidNamespaceException:
            raise NotFound()
        except model.InvalidNamespaceAutoPrunePolicy as ex:
            request_error(ex)
        except model.NamespaceAutoPrunePolicyAlreadyExists as ex:
            request_error(ex)

        log_action(
            "create_namespace_autoprune_policy",
            orgname,
            {
                "method": policy_config["method"],
                "value": policy_config["value"],
                "namespace": orgname,
            },
        )

        return {"uuid": policy.uuid}, 201


@resource("/v1/organization/<orgname>/autoprunepolicy/<policy_uuid>")
@path_param("orgname", "The name of the organization")
@path_param("policy_uuid", "The unique ID of the policy")
@show_if(features.AUTO_PRUNE)
class OrgAutoPrunePolicy(ApiResource):
    """
    Resource for fetching, updating, and deleting specific organization auto-prune policies
    """

    schemas = {
        "AutoPrunePolicyConfig": {
            "type": "object",
            "description": "The policy configuration that is to be applied to the organization",
            "required": ["method", "value"],
            "properties": {
                "method": {
                    "type": "string",
                    "description": "The method to use for pruning tags (number_of_tags, creation_date)",
                },
                "value": {
                    "type": ["integer", "string"],
                    "description": "The value to use for the pruning method (number of tags e.g. 10, time delta e.g. 7d (7 days))",
                },
            },
        },
    }

    @require_scope(scopes.ORG_ADMIN)
    @nickname("getOrganizationAutoPrunePolicy")
    def get(self, orgname, policy_uuid):
        """
        Fetches the auto-prune policy for the organization
        """
        permission = AdministerOrganizationPermission(orgname)
        if not permission.can() and not allow_if_superuser():
            raise Unauthorized()

        policy = model.autoprune.get_namespace_autoprune_policy(orgname, policy_uuid)
        if policy is None:
            raise NotFound()

        return policy.get_view()

    @require_scope(scopes.ORG_ADMIN)
    @validate_json_request("AutoPrunePolicyConfig")
    @nickname("updateOrganizationAutoPrunePolicy")
    def put(self, orgname, policy_uuid):
        """
        Updates the auto-prune policy for the organization
        """
        permission = AdministerOrganizationPermission(orgname)
        if not permission.can() and not allow_if_superuser():
            raise Unauthorized()

        app_data = request.get_json()
        method = app_data.get("method", None)
        value = app_data.get("value", None)

        if method is None or value is None:
            request_error(message="Missing the following parameters: method, value")

        policy_config = {
            "method": method,
            "value": value,
        }

        try:
            updated = model.autoprune.update_namespace_autoprune_policy(
                orgname, policy_uuid, policy_config
            )
            if not updated:
                request_error(message="could not update policy")
        except model.InvalidNamespaceException:
            raise NotFound()
        except model.InvalidNamespaceAutoPrunePolicy as ex:
            request_error(ex)
        except model.NamespaceAutoPrunePolicyDoesNotExist as ex:
            raise NotFound()

        log_action(
            "update_namespace_autoprune_policy",
            orgname,
            {
                "method": policy_config["method"],
                "value": policy_config["value"],
                "namespace": orgname,
            },
        )

        return {"uuid": policy_uuid}, 204

    @require_scope(scopes.ORG_ADMIN)
    @nickname("deleteOrganizationAutoPrunePolicy")
    def delete(self, orgname, policy_uuid):
        """
        Deletes the auto-prune policy for the organization
        """
        permission = AdministerOrganizationPermission(orgname)
        if not permission.can() and not allow_if_superuser():
            raise Unauthorized()

        try:
            updated = model.autoprune.delete_namespace_autoprune_policy(orgname, policy_uuid)
            if not updated:
                raise InvalidRequest("could not delete policy")
        except model.InvalidNamespaceException as ex:
            raise NotFound()
        except model.NamespaceAutoPrunePolicyDoesNotExist as ex:
            raise NotFound()

        log_action(
            "delete_namespace_autoprune_policy",
            orgname,
            {"policy_uuid": policy_uuid, "namespace": orgname},
        )

        return {"uuid": policy_uuid}, 200


@resource("/v1/user/autoprunepolicy/")
@show_if(features.AUTO_PRUNE)
class UserAutoPrunePolicies(ApiResource):
    """
    Resource for listing and creating organization auto-prune policies
    """

    schemas = {
        "AutoPrunePolicyConfig": {
            "type": "object",
            "description": "The policy configuration that is to be applied to the user namespace",
            "required": ["method", "value"],
            "properties": {
                "method": {
                    "type": "string",
                    "description": "The method to use for pruning tags (number_of_tags, creation_date)",
                },
                "value": {
                    "type": ["integer", "string"],
                    "description": "The value to use for the pruning method (number of tags e.g. 10, time delta e.g. 7d (7 days))",
                },
            },
        },
    }

    @require_user_admin()
    @nickname("listUserAutoPrunePolicies")
    def get(self):
        """
        Lists the auto-prune policies for the currently logged in user
        """
        user = get_authenticated_user()

        policies = model.autoprune.get_namespace_autoprune_policies_by_orgname(user.username)

        return {"policies": [policy.get_view() for policy in policies]}

    @require_user_admin()
    @validate_json_request("AutoPrunePolicyConfig")
    @nickname("createUserAutoPrunePolicy")
    def post(self):
        """
        Creates the auto-prune policy for the currently logged in user
        """
        user = get_authenticated_user()

        app_data = request.get_json()
        method = app_data.get("method", None)
        value = app_data.get("value", None)

        if method is None or value is None:
            request_error(message="Missing the following parameters: method, value")

        policy_config = {
            "method": method,
            "value": value,
        }
        try:
            policy = model.autoprune.create_namespace_autoprune_policy(
                user.username, policy_config, create_task=True
            )
        except model.InvalidNamespaceException:
            raise NotFound()
        except model.InvalidNamespaceAutoPrunePolicy as ex:
            request_error(ex)
        except model.NamespaceAutoPrunePolicyAlreadyExists as ex:
            request_error(ex)

        log_action(
            "create_namespace_autoprune_policy",
            user.username,
            {
                "method": policy_config["method"],
                "value": policy_config["value"],
                "namespace": user.username,
            },
        )

        return {"uuid": policy.uuid}, 201


@resource("/v1/user/autoprunepolicy/<policy_uuid>")
@path_param("policy_uuid", "The unique ID of the policy")
@show_if(features.AUTO_PRUNE)
class UserAutoPrunePolicy(ApiResource):
    """
    Resource for fetching, updating, and deleting specific user auto-prune policies
    """

    schemas = {
        "AutoPrunePolicyConfig": {
            "type": "object",
            "description": "The policy configuration that is to be applied to the user namespace",
            "required": ["method", "value"],
            "properties": {
                "method": {
                    "type": "string",
                    "description": "The method to use for pruning tags (number_of_tags, creation_date)",
                },
                "value": {
                    "type": ["integer", "string"],
                    "description": "The value to use for the pruning method (number of tags e.g. 10, time delta e.g. 7d (7 days))",
                },
            },
        },
    }

    @require_user_admin()
    @nickname("getUserAutoPrunePolicy")
    def get(self, policy_uuid):
        """
        Fetches the auto-prune policy for the currently logged in user
        """
        user = get_authenticated_user()

        policy = model.autoprune.get_namespace_autoprune_policy(user.username, policy_uuid)
        if policy is None:
            raise NotFound()

        return policy.get_view()

    @require_user_admin()
    @validate_json_request("AutoPrunePolicyConfig")
    @nickname("updateUserAutoPrunePolicy")
    def put(self, policy_uuid):
        """
        Updates the auto-prune policy for the currently logged in user
        """
        user = get_authenticated_user()

        app_data = request.get_json()
        method = app_data.get("method", None)
        value = app_data.get("value", None)

        if method is None or value is None:
            request_error(message="Missing the following parameters: method, value")

        policy_config = {
            "method": method,
            "value": value,
        }

        try:
            updated = model.autoprune.update_namespace_autoprune_policy(
                user.username, policy_uuid, policy_config
            )
            if not updated:
                raise InvalidRequest("could not update policy")
        except model.InvalidNamespaceException:
            raise NotFound()
        except model.InvalidNamespaceAutoPrunePolicy as ex:
            request_error(ex)
        except model.NamespaceAutoPrunePolicyDoesNotExist as ex:
            raise NotFound()

        log_action(
            "update_namespace_autoprune_policy",
            user.username,
            {
                "method": policy_config["method"],
                "value": policy_config["value"],
                "namespace": user.username,
            },
        )

        return {"uuid": policy_uuid}, 204

    @require_user_admin()
    @nickname("deleteUserAutoPrunePolicy")
    def delete(self, policy_uuid):
        """
        Deletes the auto-prune policy for the currently logged in user
        """
        user = get_authenticated_user()

        try:
            updated = model.autoprune.delete_namespace_autoprune_policy(user.username, policy_uuid)
            if not updated:
                raise InvalidRequest("could not delete policy")
        except model.InvalidNamespaceException as ex:
            raise NotFound()
        except model.NamespaceAutoPrunePolicyDoesNotExist as ex:
            raise NotFound()

        log_action(
            "delete_namespace_autoprune_policy",
            user.username,
            {"policy_uuid": policy_uuid, "namespace": user.username},
        )

        return {"uuid": policy_uuid}, 200
