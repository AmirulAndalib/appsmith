package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * This class will hold the fields that will be consumed by the client after the successful CRUD page generation
 */
@NoArgsConstructor
@Getter
@Setter
public class CRUDPageResponseDTO {

    @JsonView(Views.Public.class)
    PageDTO page;

    // This field will give some guidelines how to interact with the widgets on the canvas created by CreateDBTablePageSolution
    // e.g. We have generated the table from Datasource. You can use the Form> to modify it. Since all your data is
    // already connected you can add more queries and modify the bindings
    @JsonView(Views.Public.class)
    String successMessage;

    // This field will be used to display the image on how to use the template application
    @JsonView(Views.Public.class)
    String successImageUrl;
}
