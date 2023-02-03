package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@AllArgsConstructor
@NoArgsConstructor
@Document
public class SSLDetails implements AppsmithDomain {

    public enum AuthType {
        // Default driver configurations
        DEFAULT, NO_SSL,

        //For those drivers that don't have any specific options
        ENABLED,

        // Following for Mysql/Postgres Connections.
        ALLOW, PREFER, REQUIRE, DISABLE, VERIFY_CA, VERIFY_FULL,

        // For MySql Connections
        PREFERRED, REQUIRED, DISABLED,

        // Following for MongoDB Connections.
        CA_CERTIFICATE, SELF_SIGNED_CERTIFICATE
    }

    public enum CACertificateType {
        // In case user does not want to provide any certificate
        NONE,

        // Provide CA Certificate file
        FILE,

        // Some services provide CA certificate as a base64 encoded string instead of a file.
        BASE64_STRING
    }

    @JsonView(Views.Public.class)
    AuthType authType;

    @JsonView(Views.Public.class)
    CACertificateType caCertificateType;

    @JsonView(Views.Public.class)
    UploadedFile keyFile;

    @JsonView(Views.Public.class)
    UploadedFile certificateFile;

    @JsonView(Views.Public.class)
    UploadedFile caCertificateFile;

    @JsonView(Views.Public.class)
    Boolean usePemCertificate;

    @JsonView(Views.Public.class)
    PEMCertificate pemCertificate;

}
