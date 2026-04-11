Cate = Trim(Request.QueryString("Cate"))
If Cate <> "" And Cate = 12 Then
Response.Redirect "catalog.asp"
Response.End
End If